#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { EcrStack } from '../lib/ecr-stack';
import { DatabaseStack } from '../lib/database-stack';
import { CacheStack } from '../lib/cache-stack';
import { AuthStack } from '../lib/auth-stack';
import { EcsStack } from '../lib/ecs-stack';
import { AlbStack } from '../lib/alb-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-2', // Default to us-east-2 as per API documentation
};

// 1. Network Stack (Shared VPC)
const networkStack = new NetworkStack(app, 'ZappiNetworkStack', { env });

// 2. ECR Repositories Stack
const ecrStack = new EcrStack(app, 'ZappiEcrStack', { env });

// 3. Database Stack (3 independent PostgreSQL DBs)
const databaseStack = new DatabaseStack(app, 'ZappiDatabaseStack', {
  env,
  vpc: networkStack.vpc,
});
databaseStack.addDependency(networkStack);

// 4. Redis Cache Stack
const cacheStack = new CacheStack(app, 'ZappiCacheStack', {
  env,
  vpc: networkStack.vpc,
});
cacheStack.addDependency(networkStack);

// 5. Cognito Auth Stack
const authStack = new AuthStack(app, 'ZappiAuthStack', { env });

// 6. ECS Fargate Cluster & Services Stack
const ecsStack = new EcsStack(app, 'ZappiEcsStack', {
  env,
  vpc: networkStack.vpc,
  deviceRepo: ecrStack.deviceRepo,
  customerRepo: ecrStack.customerRepo,
  walletRepo: ecrStack.walletRepo,
  deviceDbSecret: databaseStack.deviceDbSecret,
  customerDbSecret: databaseStack.customerDbSecret,
  walletDbSecret: databaseStack.walletDbSecret,
  deviceDbEndpoint: databaseStack.deviceDb.dbInstanceEndpointAddress,
  customerDbEndpoint: databaseStack.customerDb.dbInstanceEndpointAddress,
  walletDbEndpoint: databaseStack.walletDb.dbInstanceEndpointAddress,
  redisEndpoint: cacheStack.redisEndpoint,
  redisPort: cacheStack.redisPort,
  userPoolId: authStack.userPool.userPoolId,
  userPoolClientId: authStack.userPoolClient.userPoolClientId,
});
ecsStack.addDependency(networkStack);
ecsStack.addDependency(ecrStack);
ecsStack.addDependency(databaseStack);
ecsStack.addDependency(cacheStack);
ecsStack.addDependency(authStack);

// 7. Application Load Balancer Stack
const albStack = new AlbStack(app, 'ZappiAlbStack', {
  env,
  vpc: networkStack.vpc,
  deviceService: ecsStack.deviceService,
  customerService: ecsStack.customerService,
  walletService: ecsStack.walletService,
});
albStack.addDependency(networkStack);
albStack.addDependency(ecsStack);

// 8. API Gateway Stack
const apiStack = new ApiStack(app, 'ZappiApiStack', {
  env,
  vpc: networkStack.vpc,
  albDns: albStack.loadBalancer.loadBalancerDnsName,
});
apiStack.addDependency(networkStack);
apiStack.addDependency(albStack);
