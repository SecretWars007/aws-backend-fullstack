# AWS Backend Onboarding (Zappi)

This repository contains the backend and infrastructure code for the Zappi registration and authentication flow.

## Project Structure

- `backend/`: Contains the Smithy API definitions and the TypeScript Lambda handlers for the business logic.
- `infrastructure/`: Contains the AWS CDK codebase defining the cloud resources (VPC, Aurora PostgreSQL, Cognito User Pools, API Gateway, and Lambdas).

## Prerequisites
- Node.js >= 20
- AWS CDK CLI (`npm install -g aws-cdk`)
- Docker (optional, but recommended for local Postgres testing)

## Getting Started

First, install dependencies for both projects:
```bash
cd backend
npm install
cd ../infrastructure
npm install
```

## Deployment

1. Make sure your AWS credentials are configured (`aws configure`).
2. Build the backend code:
```bash
cd backend
npm run build
```
3. Deploy the CDK stacks:
```bash
cd infrastructure
npx cdk bootstrap
npx cdk deploy --all
```
