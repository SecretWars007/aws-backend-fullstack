import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';

export interface CacheStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class CacheStack extends cdk.Stack {
  public readonly redisEndpoint: string;
  public readonly redisPort: string;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    // Create a security group for Redis
    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSG', {
      vpc,
      description: 'Access to Redis cluster from within the VPC',
      allowAllOutbound: true,
    });

    redisSecurityGroup.connections.allowFromAnyIpv4(ec2.Port.tcp(6379), 'Allow Redis access from within the VPC');

    // Create Subnet Group for Redis using private subnets
    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnets for Redis cache',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
    });

    // Create a single node Redis cluster for cost efficiency in development
    const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      cacheSubnetGroupName: subnetGroup.ref,
    });

    this.redisEndpoint = redisCluster.attrRedisEndpointAddress;
    this.redisPort = redisCluster.attrRedisEndpointPort;

    new cdk.CfnOutput(this, 'RedisAddress', { value: this.redisEndpoint });
  }
}
