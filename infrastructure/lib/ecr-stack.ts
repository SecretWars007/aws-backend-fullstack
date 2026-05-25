import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class EcrStack extends cdk.Stack {
  public readonly deviceRepo: ecr.Repository;
  public readonly customerRepo: ecr.Repository;
  public readonly walletRepo: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repositoryProps = {
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN in prod
      emptyOnDelete: true,
    };

    this.deviceRepo = new ecr.Repository(this, 'DeviceRepo', {
      repositoryName: 'zappi/device-service',
      ...repositoryProps,
    });

    this.customerRepo = new ecr.Repository(this, 'CustomerRepo', {
      repositoryName: 'zappi/customer-service',
      ...repositoryProps,
    });

    this.walletRepo = new ecr.Repository(this, 'WalletRepo', {
      repositoryName: 'zappi/wallet-service',
      ...repositoryProps,
    });

    new cdk.CfnOutput(this, 'DeviceRepoUri', { value: this.deviceRepo.repositoryUri });
    new cdk.CfnOutput(this, 'CustomerRepoUri', { value: this.customerRepo.repositoryUri });
    new cdk.CfnOutput(this, 'WalletRepoUri', { value: this.walletRepo.repositoryUri });
  }
}
