import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface DatabaseStackProps extends cdk.StackProps {}

export class DatabaseStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly instance: rds.IDatabaseInstance;
  public readonly dbSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props?: DatabaseStackProps) {
    super(scope, id, props);

    // Create a VPC for the database and lambda functions
    this.vpc = new ec2.Vpc(this, 'ZappiVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Create a secret for the database credentials
    this.dbSecret = new secretsmanager.Secret(this, 'ZappiDbSecret', {
      secretName: 'zappi/db-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'zappiuser' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
      },
    });

    // Create RDS PostgreSQL instance (Free Tier eligible)
    this.instance = new rds.DatabaseInstance(this, 'ZappiDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_10,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      databaseName: 'zappi',
      allocatedStorage: 20,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.instance.connections.allowDefaultPortFromAnyIpv4('Allow database access from within the VPC');

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.instance.dbInstanceEndpointAddress,
    });
    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: this.dbSecret.secretArn,
    });
  }
}
