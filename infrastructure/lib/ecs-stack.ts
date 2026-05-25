import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface EcsStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  deviceRepo: ecr.IRepository;
  customerRepo: ecr.IRepository;
  walletRepo: ecr.IRepository;
  deviceDbSecret: secretsmanager.ISecret;
  customerDbSecret: secretsmanager.ISecret;
  walletDbSecret: secretsmanager.ISecret;
  deviceDbEndpoint: string;
  customerDbEndpoint: string;
  walletDbEndpoint: string;
  redisEndpoint: string;
  redisPort: string;
  userPoolId: string;
  userPoolClientId: string;
}

export class EcsStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  
  public readonly deviceService: ecs.FargateService;
  public readonly customerService: ecs.FargateService;
  public readonly walletService: ecs.FargateService;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    this.cluster = new ecs.Cluster(this, 'ZappiCluster', {
      vpc: props.vpc,
      clusterName: 'zappi-cluster',
    });

    const isMockMode = 'true'; // Configurable default is mock mode as per plan

    // Helper to create task definitions and Fargate services
    const createFargateService = (
      name: string,
      port: number,
      repo: ecr.IRepository,
      dbSecret: secretsmanager.ISecret,
      env: { [key: string]: string }
    ) => {
      // Create execution role
      const executionRole = new iam.Role(this, `${name}ExecutionRole`, {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
        ],
      });
      dbSecret.grantRead(executionRole);

      // Create task role
      const taskRole = new iam.Role(this, `${name}TaskRole`, {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      });

      const taskDefinition = new ecs.FargateTaskDefinition(this, `${name}TaskDef`, {
        memoryLimitMiB: 512,
        cpu: 256,
        executionRole,
        taskRole,
      });

      const logGroup = new logs.LogGroup(this, `${name}LogGroup`, {
        logGroupName: `/ecs/zappi/${name.toLowerCase()}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      const container = taskDefinition.addContainer(`${name}Container`, {
        image: ecs.ContainerImage.fromEcrRepository(repo, 'latest'),
        logging: ecs.LogDrivers.awsLogs({
          streamPrefix: 'ecs',
          logGroup,
        }),
        environment: {
          PORT: port.toString(),
          MOCK_MODE: isMockMode,
          NODE_ENV: 'production',
          ...env,
        },
        secrets: {
          // Secret references
          DB_PASS_JSON: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
        },
      });

      container.addPortMappings({
        containerPort: port,
        protocol: ecs.Protocol.TCP,
      });

      // Security Group for Fargate Tasks
      const serviceSG = new ec2.SecurityGroup(this, `${name}SG`, {
        vpc: props.vpc,
        description: `Security group for ${name} service`,
        allowAllOutbound: true,
      });
      serviceSG.connections.allowFromAnyIpv4(ec2.Port.tcp(port), `Allow access on port ${port}`);

      const service = new ecs.FargateService(this, `${name}Service`, {
        cluster: this.cluster,
        taskDefinition,
        desiredCount: 2, // 2 tasks for HA
        securityGroups: [serviceSG],
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        assignPublicIp: false,
      });

      // Auto Scaling setup
      const scaling = service.autoScaleTaskCount({ minCapacity: 2, maxCapacity: 10 });
      scaling.scaleOnCpuUtilization('CpuScaling', {
        targetUtilizationPercent: 70,
      });

      return service;
    };

    // 1. Device Service
    this.deviceService = createFargateService('Device', 3001, props.deviceRepo, props.deviceDbSecret, {
      DB_HOST: props.deviceDbEndpoint,
      DB_PORT: '5432',
      DB_NAME: 'device_db',
      DB_USER: 'deviceuser',
      JWT_DEVICE_SECRET: 'prod-device-secret-key-ecs-deployment-1234',
      REDIS_URL: `redis://${props.redisEndpoint}:${props.redisPort}`,
    });

    // 2. Customer Service
    this.customerService = createFargateService('Customer', 3002, props.customerRepo, props.customerDbSecret, {
      DB_HOST: props.customerDbEndpoint,
      DB_PORT: '5432',
      DB_NAME: 'customer_db',
      DB_USER: 'customeruser',
      JWT_DEVICE_SECRET: 'prod-device-secret-key-ecs-deployment-1234',
      JWT_USER_SECRET: 'prod-user-secret-key-ecs-deployment-1234',
      REDIS_URL: `redis://${props.redisEndpoint}:${props.redisPort}`,
      COGNITO_USER_POOL_ID: props.userPoolId,
      COGNITO_CLIENT_ID: props.userPoolClientId,
      AWS_REGION: this.region,
      WALLET_SERVICE_URL: `http://wallet-service.local:3003`, // We will use Service Discovery or simple VPC IP routing
    });

    // 3. Wallet Service
    this.walletService = createFargateService('Wallet', 3003, props.walletRepo, props.walletDbSecret, {
      DB_HOST: props.walletDbEndpoint,
      DB_PORT: '5432',
      DB_NAME: 'wallet_db',
      DB_USER: 'walletuser',
      JWT_DEVICE_SECRET: 'prod-device-secret-key-ecs-deployment-1234',
      JWT_USER_SECRET: 'prod-user-secret-key-ecs-deployment-1234',
      REDIS_URL: `redis://${props.redisEndpoint}:${props.redisPort}`,
      CUSTOMER_SERVICE_URL: `http://customer-service.local:3002`,
    });

    // Enable Cloud Map Service Discovery for inter-service communication
    this.cluster.addDefaultCloudMapNamespace({
      name: 'local',
    });

    (this.customerService as any).enableCloudMap({ name: 'customer-service' });
    (this.walletService as any).enableCloudMap({ name: 'wallet-service' });
  }
}
