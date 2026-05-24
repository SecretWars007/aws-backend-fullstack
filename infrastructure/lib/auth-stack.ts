import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export interface AuthStackProps extends cdk.StackProps {}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: AuthStackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, 'ZappiUserPool', {
      userPoolName: 'zappi-users',
      selfSignUpEnabled: false, // We use AdminCreateUser in lambda
      signInAliases: {
        phone: true, // cellphone is the username
        email: true,
      },
      standardAttributes: {
        email: { required: true, mutable: true },
        phoneNumber: { required: true, mutable: true },
      },
      customAttributes: {
        cic: new cognito.StringAttribute({ mutable: true }),
        document_number: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: false,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN in prod
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'ZappiClient', {
      userPool: this.userPool,
      userPoolClientName: 'zappi-app-client',
      generateSecret: false, // Mobile apps/SPA cannot secure a secret
      authFlows: {
        adminUserPassword: true,
        userSrp: true,
      },
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
    });
  }
}
