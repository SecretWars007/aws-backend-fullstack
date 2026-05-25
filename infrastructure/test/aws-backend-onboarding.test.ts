import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { NetworkStack } from '../lib/network-stack';
import { EcrStack } from '../lib/ecr-stack';
import { DatabaseStack } from '../lib/database-stack';
import { CacheStack } from '../lib/cache-stack';
import { AuthStack } from '../lib/auth-stack';
import { EcsStack } from '../lib/ecs-stack';
import { AlbStack } from '../lib/alb-stack';
import { ApiStack } from '../lib/api-stack';

describe('AWS CDK Infrastructure Stacks Verification', () => {
  let app: cdk.App;
  const env = { account: '123456789012', region: 'us-east-2' };

  beforeEach(() => {
    app = new cdk.App();
  });

  test('1. NetworkStack creates a VPC with public, private, and isolated subnets', () => {
    const stack = new NetworkStack(app, 'TestNetworkStack', { env });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs * 3 subnets = 6
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  test('2. EcrStack creates 3 private repositories with scanOnPush enabled', () => {
    const stack = new EcrStack(app, 'TestEcrStack', { env });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ECR::Repository', 3);
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'zappi/device-service',
      ImageScanningConfiguration: {
        ScanOnPush: true,
      },
    });
  });

  test('3. DatabaseStack creates 3 independent RDS PostgreSQL instances in private subnets', () => {
    const netStack = new NetworkStack(app, 'TestNet', { env });
    const stack = new DatabaseStack(app, 'TestDbStack', { env, vpc: netStack.vpc });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::RDS::DBInstance', 3);
    template.resourceCountIs('AWS::SecretsManager::Secret', 3);
  });

  test('4. CacheStack creates a single-node ElastiCache Redis Cluster', () => {
    const netStack = new NetworkStack(app, 'TestNet', { env });
    const stack = new CacheStack(app, 'TestCacheStack', { env, vpc: netStack.vpc });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ElastiCache::CacheCluster', 1);
    template.hasResourceProperties('AWS::ElastiCache::CacheCluster', {
      Engine: 'redis',
      CacheNodeType: 'cache.t3.micro',
      NumCacheNodes: 1,
    });
  });

  test('5. AuthStack creates Cognito User Pool and Client', () => {
    const stack = new AuthStack(app, 'TestAuthStack', { env });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Cognito::UserPool', 1);
    template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
  });

  test('6. EcsStack creates ECS cluster and 3 Fargate services with CPU/Memory allocations', () => {
    const netStack = new NetworkStack(app, 'TestNet', { env });
    const ecr = new EcrStack(app, 'TestEcr', { env });
    const db = new DatabaseStack(app, 'TestDb', { env, vpc: netStack.vpc });
    const cache = new CacheStack(app, 'TestCache', { env, vpc: netStack.vpc });
    const auth = new AuthStack(app, 'TestAuth', { env });

    const stack = new EcsStack(app, 'TestEcsStack', {
      env,
      vpc: netStack.vpc,
      deviceRepo: ecr.deviceRepo,
      customerRepo: ecr.customerRepo,
      walletRepo: ecr.walletRepo,
      deviceDbSecret: db.deviceDbSecret,
      customerDbSecret: db.customerDbSecret,
      walletDbSecret: db.walletDbSecret,
      deviceDbEndpoint: 'test-device-db.localhost',
      customerDbEndpoint: 'test-customer-db.localhost',
      walletDbEndpoint: 'test-wallet-db.localhost',
      redisEndpoint: 'test-redis.localhost',
      redisPort: '6379',
      userPoolId: auth.userPool.userPoolId,
      userPoolClientId: auth.userPoolClient.userPoolClientId,
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.resourceCountIs('AWS::ECS::Service', 3);
    template.resourceCountIs('AWS::ECS::TaskDefinition', 3);
  });

  test('7. AlbStack creates ALB and routing rules', () => {
    const netStack = new NetworkStack(app, 'TestNet', { env });
    const ecr = new EcrStack(app, 'TestEcr', { env });
    const db = new DatabaseStack(app, 'TestDb', { env, vpc: netStack.vpc });
    const cache = new CacheStack(app, 'TestCache', { env, vpc: netStack.vpc });
    const auth = new AuthStack(app, 'TestAuth', { env });
    
    const ecsStack = new EcsStack(app, 'TestEcs', {
      env,
      vpc: netStack.vpc,
      deviceRepo: ecr.deviceRepo,
      customerRepo: ecr.customerRepo,
      walletRepo: ecr.walletRepo,
      deviceDbSecret: db.deviceDbSecret,
      customerDbSecret: db.customerDbSecret,
      walletDbSecret: db.walletDbSecret,
      deviceDbEndpoint: 'test-device-db.localhost',
      customerDbEndpoint: 'test-customer-db.localhost',
      walletDbEndpoint: 'test-wallet-db.localhost',
      redisEndpoint: 'test-redis.localhost',
      redisPort: '6379',
      userPoolId: auth.userPool.userPoolId,
      userPoolClientId: auth.userPoolClient.userPoolClientId,
    });

    const stack = new AlbStack(app, 'TestAlbStack', {
      env,
      vpc: netStack.vpc,
      deviceService: ecsStack.deviceService,
      customerService: ecsStack.customerService,
      walletService: ecsStack.walletService,
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::ListenerRule', 3);
  });

  test('8. ApiStack creates API Gateway REST API with proxy resource', () => {
    const netStack = new NetworkStack(app, 'TestNet', { env });
    const stack = new ApiStack(app, 'TestApiStack', {
      env,
      vpc: netStack.vpc,
      albDns: 'test-alb.us-east-2.elb.amazonaws.com',
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    template.resourceCountIs('AWS::ApiGateway::Resource', 8); // V1, V2, v1, v2 + {proxy+} for each = 8
  });
});
