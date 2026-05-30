import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

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
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly listener: elbv2.ApplicationListener;
  
  public readonly deviceService: ecs.FargateService;
  public readonly customerService: ecs.FargateService;
  public readonly walletService: ecs.FargateService;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    // 1. Create ECS Cluster
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

    // 2. Instantiate ECS Fargate Services
    // A. Device Service
    this.deviceService = createFargateService('Device', 3001, props.deviceRepo, props.deviceDbSecret, {
      DB_HOST: props.deviceDbEndpoint,
      DB_PORT: '5432',
      DB_NAME: 'device_db',
      DB_USER: 'deviceuser',
      JWT_DEVICE_SECRET: 'prod-device-secret-key-ecs-deployment-1234',
      REDIS_URL: `redis://${props.redisEndpoint}:${props.redisPort}`,
    });

    // B. Customer Service
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
      WALLET_SERVICE_URL: `http://wallet-service.local:3003`,
    });

    // C. Wallet Service
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


    // 3. Create Application Load Balancer
    const albSG = new ec2.SecurityGroup(this, 'AlbSG', {
      vpc: props.vpc,
      description: 'Security group for public ALB access',
      allowAllOutbound: true,
    });
    albSG.connections.allowFromAnyIpv4(ec2.Port.tcp(80), 'Allow HTTP traffic to the ALB');

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ZappiALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: albSG,
      loadBalancerName: 'zappi-alb',
    });

    this.listener = this.loadBalancer.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    const targetProps = {
      vpc: props.vpc,
      protocol: elbv2.ApplicationProtocol.HTTP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    };

    // Target Groups
    const deviceTargetGroup = new elbv2.ApplicationTargetGroup(this, 'DeviceTG', {
      port: 3001,
      targets: [this.deviceService],
      ...targetProps,
    });

    const customerTargetGroup = new elbv2.ApplicationTargetGroup(this, 'CustomerTG', {
      port: 3002,
      targets: [this.customerService],
      ...targetProps,
    });

    const walletTargetGroup = new elbv2.ApplicationTargetGroup(this, 'WalletTG', {
      port: 3003,
      targets: [this.walletService],
      ...targetProps,
    });

    // 4. ALB Listener Routing Rules (Split to <=5 path constraints per rule)
    
    // Rule 1: Device paths
    this.listener.addAction('DeviceRule', {
      priority: 10,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/device/*',
          '/V2/device/*',
          '/v1/device/*',
          '/v2/device/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([deviceTargetGroup]),
    });

    // Rule 1a: Device Flat Aliases
    this.listener.addAction('DeviceFlatAliasesRule', {
      priority: 11,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/*device-identify',
          '/*device-auth'
        ]),
      ],
      action: elbv2.ListenerAction.forward([deviceTargetGroup]),
    });

    // Rule 2a: Customer paths - register
    this.listener.addAction('CustomerRegisterRule', {
      priority: 20,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/register/*',
          '/V2/register/*',
          '/v1/register/*',
          '/v2/register/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([customerTargetGroup]),
    });

    // Rule 2b: Customer paths - client
    this.listener.addAction('CustomerClientRule', {
      priority: 21,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/client/*',
          '/V2/client/*',
          '/v1/client/*',
          '/v2/client/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([customerTargetGroup]),
    });

    // Rule 2c: Customer paths - profile
    this.listener.addAction('CustomerProfileRule', {
      priority: 22,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/profile/*',
          '/V2/profile/*',
          '/v1/profile/*',
          '/v2/profile/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([customerTargetGroup]),
    });

    // Rule 2d: Customer Flat Aliases 1
    this.listener.addAction('CustomerFlatAliasesRule1', {
      priority: 25,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/*document-extensions',
          '/*users-validate',
          '/*otp-generate',
          '/*face-recognition*',
          '/*users-create'
        ]),
      ],
      action: elbv2.ListenerAction.forward([customerTargetGroup]),
    });

    // Rule 2e: Customer Flat Aliases 2
    this.listener.addAction('CustomerFlatAliasesRule2', {
      priority: 26,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/*reference/register',
          '/*sign-in',
          '/*parameters'
        ]),
      ],
      action: elbv2.ListenerAction.forward([customerTargetGroup]),
    });

    // Rule 3a: Wallet paths - balances
    this.listener.addAction('WalletBalancesRule', {
      priority: 30,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/balances/*',
          '/V2/balances/*',
          '/v1/balances/*',
          '/v2/balances/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([walletTargetGroup]),
    });

    // Rule 3b: Wallet paths - transfers (prefix match)
    this.listener.addAction('WalletTransfersRule', {
      priority: 31,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/transfers/*',
          '/V2/transfers/*',
          '/v1/transfers/*',
          '/v2/transfers/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([walletTargetGroup]),
    });

    // Rule 3b-alias: Wallet specific alias for /transfers/users-validate (must be before CustomerFlatAliasesRule1 at 25)
    this.listener.addAction('WalletTransfersValidateRule', {
      priority: 23,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/*transfers/users-validate'
        ]),
      ],
      action: elbv2.ListenerAction.forward([walletTargetGroup]),
    });

    // Rule 3c: Wallet paths - recharge
    this.listener.addAction('WalletRechargeRule', {
      priority: 32,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/recharge/*',
          '/V2/recharge/*',
          '/v1/recharge/*',
          '/v2/recharge/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([walletTargetGroup]),
    });

    // Rule 3d: Wallet Flat Aliases
    this.listener.addAction('WalletFlatAliasesRule', {
      priority: 35,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/*balances',
          '/*recharge-params',
          '/*recharge-entel',
          '/*token-generate',
          '/*transfers-execute'
        ]),
      ],
      action: elbv2.ListenerAction.forward([walletTargetGroup]),
    });

    // Rule 3e: Wallet Flat Aliases 2
    this.listener.addAction('WalletFlatAliasesRule2', {
      priority: 36,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/*recharge-tigo',
          '/*recharge-viva',
          '/*movements'
        ]),
      ],
      action: elbv2.ListenerAction.forward([walletTargetGroup]),
    });

    // Rule 1.5: Wallet paths - client walletcards (high priority to evaluate before general customer client rules)
    this.listener.addAction('WalletClientCardsRule', {
      priority: 15,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/client/walletcards/*',
          '/V2/client/walletcards/*',
          '/v1/client/walletcards/*',
          '/v2/client/walletcards/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([walletTargetGroup]),
    });

    // Rule 3d: Wallet paths - walletcards
    this.listener.addAction('WalletCardsRule', {
      priority: 33,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/walletcards/*',
          '/V2/walletcards/*',
          '/v1/walletcards/*',
          '/v2/walletcards/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([walletTargetGroup]),
    });

    // Rule 3e: Wallet paths - movements history
    this.listener.addAction('WalletMovementsRule', {
      priority: 34,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/movements*',
          '/V2/movements*',
          '/v1/movements*',
          '/v2/movements*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([walletTargetGroup]),
    });

    // Default Action: 404 Not Found
    this.listener.addAction('DefaultAction', {
      action: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'application/json',
        messageBody: JSON.stringify({ state: 1, message: 'Ruta no encontrada en el ALB de Zappi', code: 'ALB_NOT_FOUND' }),
      }),
    });

    new cdk.CfnOutput(this, 'ALBDnsName', { value: this.loadBalancer.loadBalancerDnsName });
  }
}
