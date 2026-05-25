import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class DatabaseStack extends cdk.Stack {
  public readonly deviceDb: rds.DatabaseInstance;
  public readonly customerDb: rds.DatabaseInstance;
  public readonly walletDb: rds.DatabaseInstance;

  public readonly deviceDbSecret: secretsmanager.ISecret;
  public readonly customerDbSecret: secretsmanager.ISecret;
  public readonly walletDbSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    // Helper to generate a database secret
    const createDbSecret = (name: string, username: string) => {
      return new secretsmanager.Secret(this, `${name}Secret`, {
        secretName: `zappi/${name}-credentials`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username }),
          generateStringKey: 'password',
          excludePunctuation: true,
          includeSpace: false,
        },
      });
    };

    // Helper to create an RDS PostgreSQL database instance
    const createDbInstance = (name: string, dbName: string, secret: secretsmanager.ISecret) => {
      const instance = new rds.DatabaseInstance(this, `${name}Instance`, {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16_2,
        }),
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        credentials: rds.Credentials.fromSecret(secret),
        databaseName: dbName,
        allocatedStorage: 20,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      instance.connections.allowDefaultPortFromAnyIpv4('Allow database access from within VPC');
      return instance;
    };

    // 1. Device Database
    this.deviceDbSecret = createDbSecret('device-db', 'deviceuser');
    this.deviceDb = createDbInstance('DeviceDb', 'device_db', this.deviceDbSecret);

    // 2. Customer Database
    this.customerDbSecret = createDbSecret('customer-db', 'customeruser');
    this.customerDb = createDbInstance('CustomerDb', 'customer_db', this.customerDbSecret);

    // 3. Wallet Database
    this.walletDbSecret = createDbSecret('wallet-db', 'walletuser');
    this.walletDb = createDbInstance('WalletDb', 'wallet_db', this.walletDbSecret);

    new cdk.CfnOutput(this, 'DeviceDbEndpoint', { value: this.deviceDb.dbInstanceEndpointAddress });
    new cdk.CfnOutput(this, 'CustomerDbEndpoint', { value: this.customerDb.dbInstanceEndpointAddress });
    new cdk.CfnOutput(this, 'WalletDbEndpoint', { value: this.walletDb.dbInstanceEndpointAddress });
  }
}
