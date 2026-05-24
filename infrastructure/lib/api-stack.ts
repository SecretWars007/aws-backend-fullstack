import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as path from 'path';

export interface ApiStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  dbSecret: secretsmanager.ISecret;
  dbInstance: rds.IDatabaseInstance;
  userPool: cognito.IUserPool;
  userPoolClient: cognito.IUserPoolClient;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const api = new apigateway.RestApi(this, 'ZappiApi', {
      restApiName: 'Zappi API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const v1 = api.root.addResource('V1');
    const device = v1.addResource('device');
    const client = v1.addResource('client');
    const register = v1.addResource('register');
    const profile = v1.addResource('profile');

    const lambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      timeout: cdk.Duration.seconds(10),
      environment: {
        DB_SECRET_ARN: props.dbSecret.secretArn,
        DB_HOST: props.dbInstance.dbInstanceEndpointAddress,
        DB_PORT: '5432',
        DB_NAME: 'zappi',
        DB_USER: 'zappiuser',
        COGNITO_USER_POOL_ID: props.userPool.userPoolId,
        COGNITO_CLIENT_ID: props.userPoolClient.userPoolClientId,
        COGNITO_REGION: this.region,
        JWT_SECRET: 'local-dev-jwt-secret-key-1234',
      },
    };

    const createLambda = (name: string, handlerFile: string) => {
      const fn = new lambda.Function(this, name, {
        ...lambdaProps,
        code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/handlers')),
        handler: `${handlerFile}.handler`,
      });

      // Grant permissions
      props.dbSecret.grantRead(fn);
      props.userPool.grant(fn, 'cognito-idp:AdminCreateUser');
      props.userPool.grant(fn, 'cognito-idp:AdminSetUserPassword');
      props.userPool.grant(fn, 'cognito-idp:AdminInitiateAuth');
      props.userPool.grant(fn, 'cognito-idp:AdminGetUser');

      return new apigateway.LambdaIntegration(fn);
    };

    // Endpoints
    device.addResource('identification').addMethod('POST', createLambda('DeviceIdentificationFn', 'deviceIdentification'));
    device.addResource('authenticate').addMethod('POST', createLambda('DeviceAuthenticateFn', 'deviceAuthenticate'));

    const clientDeviceRegExt = client.addResource('device').addResource('register').addResource('extension');
    clientDeviceRegExt.addResource('get').addMethod('POST', createLambda('GetExtensionCatalogFn', 'getExtensionCatalog'));

    const regValidate = register.addResource('validate');
    regValidate.addResource('user').addMethod('POST', createLambda('ValidateUserFn', 'validateUser'));
    regValidate.addResource('otp').addMethod('POST', createLambda('ValidateOtpFn', 'validateOtp'));

    const regFace = register.addResource('init').addResource('face').addResource('recognition');
    regFace.addMethod('POST', createLambda('InitFaceRecognitionFn', 'initFaceRecognition'));

    const execFace = register.addResource('execute').addResource('face').addResource('recognition');
    execFace.addMethod('POST', createLambda('ExecuteFaceRecognitionFn', 'executeFaceRecognition'));

    const clientRef = client.addResource('reference');
    clientRef.addResource('register').addResource('code').addMethod('POST', createLambda('RegisterReferenceCodeFn', 'registerReferenceCode'));
    clientRef.addResource('welcome').addMethod('POST', createLambda('WelcomeReferenceFn', 'welcomeReference'));

    register.addResource('create').addResource('account').addMethod('POST', createLambda('CreateAccountFn', 'createAccount'));

    client.addResource('login').addResource('get').addMethod('POST', createLambda('LoginFn', 'login'));

    profile.addResource('parameters').addResource('get').addMethod('POST', createLambda('GetProfileParametersFn', 'getProfileParameters'));

    client.addResource('walletcards').addResource('information').addResource('get').addMethod('POST', createLambda('GetWalletCardsFn', 'getWalletCards'));

    // Temporary endpoint to initialize the DB
    api.root.addResource('init-db').addMethod('GET', createLambda('InitDbFn', 'initDb'));
  }
}
