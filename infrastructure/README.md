# Zappi Infrastructure

This project defines the AWS infrastructure using the AWS Cloud Development Kit (CDK).

## Stacks
- **DatabaseStack (`database-stack.ts`)**: Creates the VPC, Aurora Serverless v2 PostgreSQL cluster, and stores credentials securely in AWS Secrets Manager.
- **AuthStack (`auth-stack.ts`)**: Sets up an Amazon Cognito User Pool tailored for the Zappi onboarding flow (phone number as username, custom attributes like CIC).
- **ApiStack (`api-stack.ts`)**: Creates the AWS API Gateway and maps the routes to the respective TypeScript Lambda functions compiled by the backend project.

## Commands

- `npm run build`   compile typescript to js
- `npm run watch`   watch for changes and compile
- `npm run test`    perform the jest unit tests
- `cdk deploy`      deploy this stack to your default AWS account/region
- `cdk diff`        compare deployed stack with current state
- `cdk synth`       emits the synthesized CloudFormation template
