#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { AuthStack } from '../lib/auth-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const dbStack = new DatabaseStack(app, 'ZappiDatabaseStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

const authStack = new AuthStack(app, 'ZappiAuthStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new ApiStack(app, 'ZappiApiStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpc: dbStack.vpc,
  dbInstance: dbStack.instance,
  dbSecret: dbStack.dbSecret,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
});
