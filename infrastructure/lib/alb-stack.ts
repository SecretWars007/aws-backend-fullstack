import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecs from 'aws-cdk-lib/aws-ecs';

export interface AlbStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  deviceService: ecs.FargateService;
  customerService: ecs.FargateService;
  walletService: ecs.FargateService;
}

export class AlbStack extends cdk.Stack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly listener: elbv2.ApplicationListener;

  constructor(scope: Construct, id: string, props: AlbStackProps) {
    super(scope, id, props);

    // Create a security group for the ALB
    const albSG = new ec2.SecurityGroup(this, 'AlbSG', {
      vpc: props.vpc,
      description: 'Security group for public ALB access',
      allowAllOutbound: true,
    });
    albSG.connections.allowFromAnyIpv4(ec2.Port.tcp(80), 'Allow HTTP traffic to the ALB');

    // Create the ALB
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ZappiALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: albSG,
      loadBalancerName: 'zappi-alb',
    });

    // Add HTTP listener on port 80
    this.listener = this.loadBalancer.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    // ── Target Groups ──
    const targetProps = {
      vpc: props.vpc,
      protocol: elbv2.ApplicationProtocol.HTTP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    };

    // 1. Device Service Target Group (port 3001)
    const deviceTargetGroup = new elbv2.ApplicationTargetGroup(this, 'DeviceTG', {
      port: 3001,
      targets: [props.deviceService],
      ...targetProps,
    });

    // 2. Customer Service Target Group (port 3002)
    const customerTargetGroup = new elbv2.ApplicationTargetGroup(this, 'CustomerTG', {
      port: 3002,
      targets: [props.customerService],
      ...targetProps,
    });

    // 3. Wallet Service Target Group (port 3003)
    const walletTargetGroup = new elbv2.ApplicationTargetGroup(this, 'WalletTG', {
      port: 3003,
      targets: [props.walletService],
      ...targetProps,
    });

    // ── Routing Rules for V1 & V2 (HTTP path routing) ──

    // Rule 1: Device paths
    this.listener.addAction('DeviceRule', {
      priority: 10,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/device/*',
          '/V2/device/*',
          '/v1/device/*',
          '/v2/device/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([deviceTargetGroup]),
    });

    // Rule 2: Customer paths - register
    this.listener.addAction('CustomerRegisterRule', {
      priority: 20,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/register/*',
          '/V2/register/*',
          '/v1/register/*',
          '/v2/register/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([customerTargetGroup]),
    });

    // Rule 2b: Customer paths - client
    this.listener.addAction('CustomerClientRule', {
      priority: 21,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/client/*',
          '/V2/client/*',
          '/v1/client/*',
          '/v2/client/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([customerTargetGroup]),
    });

    // Rule 2c: Customer paths - profile
    this.listener.addAction('CustomerProfileRule', {
      priority: 22,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/profile/*',
          '/V2/profile/*',
          '/v1/profile/*',
          '/v2/profile/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([customerTargetGroup]),
    });

    // Rule 3: Wallet paths - balances
    this.listener.addAction('WalletBalancesRule', {
      priority: 30,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/balances/*',
          '/V2/balances/*',
          '/v1/balances/*',
          '/v2/balances/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([walletTargetGroup]),
    });

    // Rule 3b: Wallet paths - transfers
    this.listener.addAction('WalletTransfersRule', {
      priority: 31,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/transfers/*',
          '/V2/transfers/*',
          '/v1/transfers/*',
          '/v2/transfers/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([walletTargetGroup]),
    });

    // Rule 3c: Wallet paths - recharge
    this.listener.addAction('WalletRechargeRule', {
      priority: 32,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/recharge/*',
          '/V2/recharge/*',
          '/v1/recharge/*',
          '/v2/recharge/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([walletTargetGroup]),
    });

    // Rule 3d: Wallet paths - walletcards
    this.listener.addAction('WalletCardsRule', {
      priority: 33,
      conditions: [
        elbv2.ListenerCondition.pathPatterns([
          '/V1/walletcards/*',
          '/V2/walletcards/*',
          '/v1/walletcards/*',
          '/v2/walletcards/*'
        ]),
      ],
      action: elbv2.ListenerAction.forward([walletTargetGroup]),
    });

    // Default Action: 404 Not Found
    this.listener.addAction('DefaultAction', {
      action: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'application/json',
        messageBody: JSON.stringify({ state: 1, message: 'Ruta no encontrada en el ALB de Zappi', code: 'ALB_NOT_FOUND' }),
      }),
    });

    new cdk.CfnOutput(this, 'ALBDnsName', { value: this.loadBalancer.loadBalancerDnsName });
  }
}
