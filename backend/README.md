# Zappi Backend

This project contains the business logic for the Zappi onboarding endpoints.

## Tech Stack
- **Smithy:** API modeling language.
- **TypeScript:** Implementation language for AWS Lambda handlers.
- **PostgreSQL (`pg`):** Database driver to connect to Aurora Serverless.
- **Cognito SDK (`@aws-sdk/client-cognito-identity-provider`):** For user management and authentication.

## Smithy Models
The API is fully documented in `smithy/main.smithy`. 
To generate the OpenAPI spec (requires the Smithy CLI installed globally):
```bash
smithy build
```

## Building Handlers
We use `esbuild` to quickly bundle our TypeScript handlers.
```bash
npm run build
```
This outputs the bundled JS files to `dist/handlers/`, which the CDK infrastructure project will point to when defining the Lambda functions.
