import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface ApiStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  albDns: string;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create API Gateway REST API
    const api = new apigateway.RestApi(this, 'ZappiApiGateway', {
      restApiName: 'Zappi API Gateway',
      description: 'API Gateway proxying requests to the ECS Application Load Balancer',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Device-Token'],
      },
    });

    // Helper to create proxy resource under a root path (e.g. /V1/ or /V2/)
    const addProxyRoute = (rootPath: string) => {
      const resource = api.root.addResource(rootPath);
      
      const pathSpecificIntegration = new apigateway.HttpIntegration(
        `http://${props.albDns}/${rootPath}/{proxy}`,
        {
          httpMethod: 'ANY',
          options: {
            requestParameters: {
              'integration.request.path.proxy': 'method.request.path.proxy',
            },
          },
        }
      );

      const proxyResource = resource.addProxy({
        defaultIntegration: pathSpecificIntegration,
        anyMethod: true,
        defaultMethodOptions: {
          requestParameters: {
            'method.request.path.proxy': true,
          },
        },
      });
      return proxyResource;
    };

    // Add support for V1 and V2 versions (both upper and lower case for maximum flexibility)
    addProxyRoute('V1');
    addProxyRoute('V2');
    addProxyRoute('v1');
    addProxyRoute('v2');

    new cdk.CfnOutput(this, 'ApiGatewayUrl', { value: api.url });
  }
}
