/**
 * ☁️ VIRTUAL MATERIAL SYNC ENGINE
 * 
 * Advanced Practice #4: Auto-update Docker/AWS/GCP templates with Singularity Core.
 * 
 * This module synchronizes infrastructure templates across all cloud providers,
 * ensuring consistent deployments and automatic propagation of core updates.
 * 
 * Features:
 * - Multi-cloud template management
 * - Automatic version synchronization
 * - Infrastructure as Code generation
 * - Deployment validation
 * - Rollback capabilities
 * 
 * @version 1.0.0
 * @phase Future Practices - Beyond Phase 100
 * @author QANTUM AI Architect
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';

// ============================================================
// TYPES
// ============================================================

interface CloudTemplate {
    templateId: string;
    provider: 'aws' | 'azure' | 'gcp' | 'docker' | 'kubernetes';
    name: string;
    version: string;
    content: string;
    hash: string;
    lastUpdated: number;
    dependencies: string[];
    variables: Record<string, TemplateVariable>;
}

interface TemplateVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    default?: any;
    required: boolean;
    description: string;
}

interface SyncResult {
    templateId: string;
    provider: string;
    status: 'updated' | 'created' | 'unchanged' | 'failed';
    oldVersion?: string;
    newVersion: string;
    changes: string[];
    errors: string[];
    timestamp: number;
}

interface DeploymentConfig {
    environment: 'development' | 'staging' | 'production';
    region: string;
    variables: Record<string, any>;
    dryRun: boolean;
}

interface SingularityCore {
    version: string;
    modules: string[];
    config: Record<string, any>;
    dependencies: Record<string, string>;
}

interface VirtualMaterialConfig {
    outputDir: string;
    providers: ('aws' | 'azure' | 'gcp' | 'docker' | 'kubernetes')[];
    autoSync: boolean;
    validateOnSync: boolean;
    backupBeforeUpdate: boolean;
}

// ============================================================
// VIRTUAL MATERIAL SYNC ENGINE
// ============================================================

export class VirtualMaterialSyncEngine extends EventEmitter {
    private config: VirtualMaterialConfig;
    private templates: Map<string, CloudTemplate> = new Map();
    private syncHistory: SyncResult[] = [];
    private singularityCore: SingularityCore | null = null;

    // Template patterns for each provider
    private static readonly TEMPLATE_GENERATORS: Record<string, (core: SingularityCore, vars: Record<string, any>) => string> = {
        docker: VirtualMaterialSyncEngine.generateDockerTemplate,
        'docker-compose': VirtualMaterialSyncEngine.generateDockerComposeTemplate,
        aws: VirtualMaterialSyncEngine.generateAWSTemplate,
        'aws-lambda': VirtualMaterialSyncEngine.generateAWSLambdaTemplate,
        azure: VirtualMaterialSyncEngine.generateAzureTemplate,
        gcp: VirtualMaterialSyncEngine.generateGCPTemplate,
        kubernetes: VirtualMaterialSyncEngine.generateKubernetesTemplate
    };

    constructor(config: Partial<VirtualMaterialConfig> = {}) {
        super();

        this.config = {
            outputDir: './infrastructure',
            providers: ['docker', 'aws', 'gcp', 'kubernetes'],
            autoSync: true,
            validateOnSync: true,
            backupBeforeUpdate: true,
            ...config
        };
    }

    /**
     * 🚀 Initialize sync engine
     */
    async initialize(): Promise<void> {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  ☁️ VIRTUAL MATERIAL SYNC ENGINE                              ║
║                                                               ║
║  "One core, infinite clouds"                                  ║
╚═══════════════════════════════════════════════════════════════╝
`);

        // Load Singularity core info
        await this.loadSingularityCore();

        // Ensure output directory exists
        if (!fs.existsSync(this.config.outputDir)) {
            fs.mkdirSync(this.config.outputDir, { recursive: true });
        }

        console.log(`   ✅ Singularity Core v${this.singularityCore?.version}`);
        console.log(`   📁 Output directory: ${this.config.outputDir}`);
        console.log(`   ☁️ Providers: ${this.config.providers.join(', ')}`);
    }

    /**
     * 📦 Load Singularity Core configuration
     */
    private async loadSingularityCore(): Promise<void> {
        // Read from package.json and singularity index
        const packageJson = JSON.parse(
            fs.readFileSync('./package.json', 'utf-8')
        );

        this.singularityCore = {
            version: packageJson.version || '1.0.0',
            modules: [
                'self-optimizing-engine',
                'global-dashboard-v3',
                'auto-deploy-pipeline',
                'commercialization-engine',
                'final-stress-test',
                'the-audit'
            ],
            config: {
                nodeVersion: '20',
                playwrightVersion: '1.40.0',
                targetMemory: '4096',
                targetCpu: '2000m',
                healthCheckPath: '/health',
                metricsPath: '/metrics'
            },
            dependencies: packageJson.dependencies || {}
        };
    }

    /**
     * 🔄 Sync all templates
     */
    async syncAllTemplates(vars: Record<string, any> = {}): Promise<SyncResult[]> {
        console.log('\n🔄 Syncing all infrastructure templates...');

        const results: SyncResult[] = [];
        const defaultVars = this.getDefaultVariables();
        const mergedVars = { ...defaultVars, ...vars };

        for (const provider of this.config.providers) {
            const result = await this.syncProviderTemplates(provider, mergedVars);
            results.push(...result);
        }

        this.syncHistory.push(...results);

        const updated = results.filter(r => r.status === 'updated' || r.status === 'created').length;
        const failed = results.filter(r => r.status === 'failed').length;

        console.log(`\n✅ Sync complete: ${updated} updated, ${failed} failed`);
        this.emit('sync:complete', results);

        return results;
    }

    /**
     * Sync templates for specific provider
     */
    private async syncProviderTemplates(
        provider: string,
        vars: Record<string, any>
    ): Promise<SyncResult[]> {
        const results: SyncResult[] = [];
        const providerDir = path.join(this.config.outputDir, provider);

        if (!fs.existsSync(providerDir)) {
            fs.mkdirSync(providerDir, { recursive: true });
        }

        const templateTypes = this.getTemplateTypesForProvider(provider);

        for (const templateType of templateTypes) {
            try {
                const result = await this.generateAndSaveTemplate(
                    provider,
                    templateType,
                    vars
                );
                results.push(result);
            } catch (error: any) {
                results.push({
                    templateId: `${provider}_${templateType}`,
                    provider,
                    status: 'failed',
                    newVersion: this.singularityCore?.version || '0.0.0',
                    changes: [],
                    errors: [error.message],
                    timestamp: Date.now()
                });
            }
        }

        return results;
    }

    /**
     * Get template types for provider
     */
    private getTemplateTypesForProvider(provider: string): string[] {
        switch (provider) {
            case 'docker':
                return ['dockerfile', 'docker-compose'];
            case 'aws':
                return ['cloudformation', 'lambda', 'ecs', 'ecr'];
            case 'azure':
                return ['arm-template', 'functions', 'container-apps'];
            case 'gcp':
                return ['cloud-run', 'cloud-functions', 'gke'];
            case 'kubernetes':
                return ['deployment', 'service', 'configmap', 'ingress', 'hpa'];
            default:
                return [];
        }
    }

    /**
     * Generate and save template
     */
    private async generateAndSaveTemplate(
        provider: string,
        templateType: string,
        vars: Record<string, any>
    ): Promise<SyncResult> {
        const templateId = `${provider}_${templateType}`;
        const generator = this.getGenerator(provider, templateType);
        
        if (!generator) {
            throw new Error(`No generator for ${provider}/${templateType}`);
        }

        const content = generator(this.singularityCore!, vars);
        const newHash = crypto.createHash('sha256').update(content).digest('hex');
        const existingTemplate = this.templates.get(templateId);
        
        const filePath = this.getTemplateFilePath(provider, templateType);
        let oldContent: string | null = null;
        
        if (fs.existsSync(filePath)) {
            oldContent = fs.readFileSync(filePath, 'utf-8');
        }

        const oldHash = oldContent 
            ? crypto.createHash('sha256').update(oldContent).digest('hex')
            : null;

        // Check if update needed
        if (oldHash === newHash) {
            return {
                templateId,
                provider,
                status: 'unchanged',
                newVersion: this.singularityCore?.version || '0.0.0',
                changes: [],
                errors: [],
                timestamp: Date.now()
            };
        }

        // Backup if enabled
        if (this.config.backupBeforeUpdate && oldContent) {
            const backupPath = `${filePath}.bak.${Date.now()}`;
            fs.writeFileSync(backupPath, oldContent);
        }

        // Write new template
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, content);

        // Validate if enabled
        if (this.config.validateOnSync) {
            const validation = await this.validateTemplate(provider, templateType, content);
            if (!validation.valid) {
                return {
                    templateId,
                    provider,
                    status: 'failed',
                    newVersion: this.singularityCore?.version || '0.0.0',
                    changes: [],
                    errors: validation.errors,
                    timestamp: Date.now()
                };
            }
        }

        // Update cache
        const template: CloudTemplate = {
            templateId,
            provider: provider as any,
            name: templateType,
            version: this.singularityCore?.version || '0.0.0',
            content,
            hash: newHash,
            lastUpdated: Date.now(),
            dependencies: [],
            variables: {}
        };
        this.templates.set(templateId, template);

        console.log(`   ✅ ${provider}/${templateType}: updated`);

        return {
            templateId,
            provider,
            status: oldContent ? 'updated' : 'created',
            oldVersion: existingTemplate?.version,
            newVersion: this.singularityCore?.version || '0.0.0',
            changes: this.detectChanges(oldContent || '', content),
            errors: [],
            timestamp: Date.now()
        };
    }

    /**
     * Get generator function
     */
    private getGenerator(
        provider: string,
        templateType: string
    ): ((core: SingularityCore, vars: Record<string, any>) => string) | null {
        const key = `${provider}-${templateType}`;
        const simpleKey = provider;

        switch (key) {
            case 'docker-dockerfile':
                return VirtualMaterialSyncEngine.generateDockerTemplate;
            case 'docker-docker-compose':
                return VirtualMaterialSyncEngine.generateDockerComposeTemplate;
            case 'aws-cloudformation':
                return VirtualMaterialSyncEngine.generateAWSTemplate;
            case 'aws-lambda':
                return VirtualMaterialSyncEngine.generateAWSLambdaTemplate;
            case 'aws-ecs':
                return VirtualMaterialSyncEngine.generateECSTemplate;
            case 'aws-ecr':
                return VirtualMaterialSyncEngine.generateECRTemplate;
            case 'azure-arm-template':
                return VirtualMaterialSyncEngine.generateAzureTemplate;
            case 'azure-functions':
                return VirtualMaterialSyncEngine.generateAzureFunctionsTemplate;
            case 'azure-container-apps':
                return VirtualMaterialSyncEngine.generateAzureContainerAppsTemplate;
            case 'gcp-cloud-run':
                return VirtualMaterialSyncEngine.generateGCPTemplate;
            case 'gcp-cloud-functions':
                return VirtualMaterialSyncEngine.generateGCPFunctionsTemplate;
            case 'gcp-gke':
                return VirtualMaterialSyncEngine.generateGKETemplate;
            case 'kubernetes-deployment':
                return VirtualMaterialSyncEngine.generateKubernetesTemplate;
            case 'kubernetes-service':
                return VirtualMaterialSyncEngine.generateK8sServiceTemplate;
            case 'kubernetes-configmap':
                return VirtualMaterialSyncEngine.generateK8sConfigMapTemplate;
            case 'kubernetes-ingress':
                return VirtualMaterialSyncEngine.generateK8sIngressTemplate;
            case 'kubernetes-hpa':
                return VirtualMaterialSyncEngine.generateK8sHPATemplate;
            default:
                return VirtualMaterialSyncEngine.TEMPLATE_GENERATORS[simpleKey] || null;
        }
    }

    /**
     * Get template file path
     */
    private getTemplateFilePath(provider: string, templateType: string): string {
        const extensions: Record<string, string> = {
            dockerfile: 'Dockerfile',
            'docker-compose': 'docker-compose.yml',
            cloudformation: 'cloudformation.yaml',
            lambda: 'lambda.yaml',
            ecs: 'ecs-task-definition.json',
            ecr: 'ecr-policy.json',
            'arm-template': 'azuredeploy.json',
            functions: 'function.json',
            'container-apps': 'containerapp.yaml',
            'cloud-run': 'cloudrun.yaml',
            'cloud-functions': 'cloudfunctions.yaml',
            gke: 'gke-cluster.yaml',
            deployment: 'deployment.yaml',
            service: 'service.yaml',
            configmap: 'configmap.yaml',
            ingress: 'ingress.yaml',
            hpa: 'hpa.yaml'
        };

        const filename = extensions[templateType] || `${templateType}.yaml`;
        return path.join(this.config.outputDir, provider, filename);
    }

    /**
     * Validate template
     */
    private async validateTemplate(
        provider: string,
        templateType: string,
        content: string
    ): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];

        // Basic validation
        if (!content || content.trim().length === 0) {
            errors.push('Template content is empty');
        }

        // Provider-specific validation
        switch (provider) {
            case 'docker':
                if (templateType === 'dockerfile' && !content.includes('FROM')) {
                    errors.push('Dockerfile missing FROM instruction');
                }
                break;
            case 'kubernetes':
                if (!content.includes('apiVersion:')) {
                    errors.push('Kubernetes manifest missing apiVersion');
                }
                if (!content.includes('kind:')) {
                    errors.push('Kubernetes manifest missing kind');
                }
                break;
            case 'aws':
                if (templateType === 'cloudformation') {
                    if (!content.includes('AWSTemplateFormatVersion')) {
                        errors.push('CloudFormation template missing AWSTemplateFormatVersion');
                    }
                }
                break;
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Detect changes between templates
     */
    private detectChanges(oldContent: string, newContent: string): string[] {
        const changes: string[] = [];
        
        const oldLines = oldContent.split('\n');
        const newLines = newContent.split('\n');

        let added = 0;
        let removed = 0;

        // Simple line-based diff
        const oldSet = new Set(oldLines);
        const newSet = new Set(newLines);

        for (const line of newLines) {
            if (!oldSet.has(line) && line.trim()) added++;
        }
        for (const line of oldLines) {
            if (!newSet.has(line) && line.trim()) removed++;
        }

        if (added > 0) changes.push(`+${added} lines added`);
        if (removed > 0) changes.push(`-${removed} lines removed`);

        return changes;
    }

    /**
     * Get default variables
     */
    private getDefaultVariables(): Record<string, any> {
        return {
            appName: 'qantum',
            version: this.singularityCore?.version || '1.0.0',
            nodeVersion: '20',
            port: 3000,
            healthCheckPath: '/health',
            metricsPath: '/metrics',
            memory: '4096',
            cpu: '2000m',
            replicas: 3,
            maxReplicas: 10,
            minReplicas: 2,
            region: 'eu-central-1',
            environment: 'production'
        };
    }

    // ============================================================
    // TEMPLATE GENERATORS
    // ============================================================

    /**
     * 🐳 Generate Dockerfile
     */
    private static generateDockerTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return `# QANTUM QA Framework v${core.version}
# Auto-generated by Virtual Material Sync Engine
# DO NOT EDIT MANUALLY - changes will be overwritten

FROM mcr.microsoft.com/playwright:v${core.config.playwrightVersion}-jammy

# Metadata
LABEL maintainer="QANTUM AI" \\
      version="${core.version}" \\
      description="QANTUM QA Framework - Singularity Core"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \\
    npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build || true

# Expose port
EXPOSE ${vars.port || 3000}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:${vars.port || 3000}${vars.healthCheckPath || '/health'} || exit 1

# Environment variables
ENV NODE_ENV=production \\
    QANTUM_MIND_VERSION=${core.version} \\
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \\
    adduser --system --uid 1001 nodejs
USER nodejs

# Start application
CMD ["node", "index.js"]
`;
    }

    /**
     * 🐙 Generate Docker Compose
     */
    private static generateDockerComposeTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return `# QANTUM QA Framework v${core.version}
# Auto-generated by Virtual Material Sync Engine

version: '3.8'

services:
  QANTUM-mind:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: QANTUM-mind-${vars.environment || 'prod'}
    image: QANTUM-mind:${core.version}
    ports:
      - "${vars.port || 3000}:${vars.port || 3000}"
    environment:
      - NODE_ENV=${vars.environment || 'production'}
      - QANTUM_MIND_VERSION=${core.version}
      - PORT=${vars.port || 3000}
      - LOG_LEVEL=info
    volumes:
      - ./screenshots:/app/screenshots
      - ./reports:/app/reports
      - ./traces:/app/traces
    networks:
      - QANTUM-mind-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${vars.port || 3000}/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: ${vars.memory || '4096'}M
          cpus: '${parseFloat(vars.cpu || '2000') / 1000}'
        reservations:
          memory: 1024M
          cpus: '0.5'

  redis:
    image: redis:7-alpine
    container_name: QANTUM-mind-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - QANTUM-mind-network
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: QANTUM-mind-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - QANTUM-mind-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: QANTUM-mind-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - QANTUM-mind-network
    restart: unless-stopped

networks:
  QANTUM-mind-network:
    driver: bridge

volumes:
  redis-data:
  prometheus-data:
  grafana-data:
`;
    }

    /**
     * ☁️ Generate AWS CloudFormation Template
     */
    private static generateAWSTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return `AWSTemplateFormatVersion: '2010-09-09'
Description: QANTUM QA Framework v${core.version} - Singularity Core

Parameters:
  Environment:
    Type: String
    Default: ${vars.environment || 'production'}
    AllowedValues:
      - development
      - staging
      - production

  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: VPC for deployment

  SubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: Subnets for deployment

Resources:
  # ECS Cluster
  QAntumCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: QANTUM-mind-\${Environment}
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1
        - CapacityProvider: FARGATE_SPOT
          Weight: 2
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Application
          Value: QAntum
        - Key: Version
          Value: ${core.version}

  # Task Definition
  QAntumTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: QANTUM-mind
      Cpu: '${vars.cpu || '2048'}'
      Memory: '${vars.memory || '4096'}'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      ExecutionRoleArn: !GetAtt ECSExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: QANTUM-mind
          Image: !Sub '\${AWS::AccountId}.dkr.ecr.\${AWS::Region}.amazonaws.com/qantum:${core.version}'
          PortMappings:
            - ContainerPort: ${vars.port || 3000}
              Protocol: tcp
          Environment:
            - Name: NODE_ENV
              Value: !Ref Environment
            - Name: QANTUM_MIND_VERSION
              Value: ${core.version}
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: /ecs/qantum
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: QANTUM-mind
          HealthCheck:
            Command:
              - CMD-SHELL
              - curl -f http://localhost:${vars.port || 3000}/health || exit 1
            Interval: 30
            Timeout: 5
            Retries: 3
            StartPeriod: 60

  # ECS Service
  QAntumService:
    Type: AWS::ECS::Service
    DependsOn: ALBListener
    Properties:
      ServiceName: QANTUM-mind-service
      Cluster: !Ref QAntumCluster
      TaskDefinition: !Ref QAntumTaskDefinition
      DesiredCount: ${vars.replicas || 3}
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: ENABLED
          SecurityGroups:
            - !Ref ServiceSecurityGroup
          Subnets: !Ref SubnetIds
      LoadBalancers:
        - ContainerName: QANTUM-mind
          ContainerPort: ${vars.port || 3000}
          TargetGroupArn: !Ref TargetGroup

  # Auto Scaling
  AutoScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MinCapacity: ${vars.minReplicas || 2}
      MaxCapacity: ${vars.maxReplicas || 10}
      ResourceId: !Sub service/\${QAntumCluster}/\${QAntumService.Name}
      ScalableDimension: ecs:service:DesiredCount
      ServiceNamespace: ecs
      RoleARN: !GetAtt AutoScalingRole.Arn

  AutoScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: QANTUM-mind-cpu-scaling
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref AutoScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        ScaleInCooldown: 300
        ScaleOutCooldown: 60

  # ALB
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: QANTUM-mind-alb
      Scheme: internet-facing
      Type: application
      Subnets: !Ref SubnetIds
      SecurityGroups:
        - !Ref ALBSecurityGroup

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: QANTUM-mind-tg
      VpcId: !Ref VpcId
      Protocol: HTTP
      Port: ${vars.port || 3000}
      TargetType: ip
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: ALB Security Group
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  ServiceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Service Security Group
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: ${vars.port || 3000}
          ToPort: ${vars.port || 3000}
          SourceSecurityGroupId: !Ref ALBSecurityGroup

  # IAM Roles
  ECSExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole

  AutoScalingRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: application-autoscaling.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceAutoscaleRole

Outputs:
  ClusterArn:
    Value: !GetAtt QAntumCluster.Arn
  ServiceUrl:
    Value: !Sub http://\${ApplicationLoadBalancer.DNSName}
  Version:
    Value: ${core.version}
`;
    }

    /**
     * Generate AWS Lambda Template
     */
    private static generateAWSLambdaTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: QANTUM Lambda Workers v${core.version}

Globals:
  Function:
    Timeout: 900
    MemorySize: 3008
    Runtime: nodejs20.x
    Environment:
      Variables:
        QANTUM_MIND_VERSION: ${core.version}
        NODE_ENV: !Ref Environment

Parameters:
  Environment:
    Type: String
    Default: production

Resources:
  QAntumWorker:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: QANTUM-mind-worker
      Handler: index.handler
      CodeUri: ./dist
      Layers:
        - !Ref PlaywrightLayer
      Policies:
        - S3CrudPolicy:
            BucketName: !Ref ResultsBucket
        - SQSPollerPolicy:
            QueueName: !GetAtt TestQueue.QueueName
      Events:
        SQSEvent:
          Type: SQS
          Properties:
            Queue: !GetAtt TestQueue.Arn
            BatchSize: 1

  PlaywrightLayer:
    Type: AWS::Serverless::LayerVersion
    Properties:
      LayerName: playwright-layer
      ContentUri: ./layers/playwright
      CompatibleRuntimes:
        - nodejs20.x

  TestQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: QANTUM-mind-test-queue
      VisibilityTimeout: 900

  ResultsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub QANTUM-mind-results-\${AWS::AccountId}
`;
    }

    private static generateECSTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return JSON.stringify({
            family: 'qantum',
            networkMode: 'awsvpc',
            requiresCompatibilities: ['FARGATE'],
            cpu: vars.cpu || '2048',
            memory: vars.memory || '4096',
            containerDefinitions: [{
                name: 'qantum',
                image: `qantum:${core.version}`,
                portMappings: [{ containerPort: vars.port || 3000 }],
                environment: [
                    { name: 'NODE_ENV', value: vars.environment || 'production' },
                    { name: 'qantum_VERSION', value: core.version }
                ]
            }]
        }, null, 2);
    }

    private static generateECRTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
                Effect: 'Allow',
                Principal: { Service: 'ecs-tasks.amazonaws.com' },
                Action: ['ecr:GetDownloadUrlForLayer', 'ecr:BatchGetImage']
            }]
        }, null, 2);
    }

    /**
     * ☁️ Generate Azure ARM Template
     */
    private static generateAzureTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return JSON.stringify({
            "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
            contentVersion: "1.0.0.0",
            parameters: {
                environment: { type: "string", defaultValue: vars.environment || "production" },
                location: { type: "string", defaultValue: "[resourceGroup().location]" }
            },
            resources: [
                {
                    type: "Microsoft.ContainerInstance/containerGroups",
                    apiVersion: "2021-10-01",
                    name: "qantum",
                    location: "[parameters('location')]",
                    properties: {
                        containers: [{
                            name: "qantum",
                            properties: {
                                image: `qantum:${core.version}`,
                                resources: {
                                    requests: {
                                        cpu: parseFloat(vars.cpu || '2000') / 1000,
                                        memoryInGB: parseInt(vars.memory || '4096') / 1024
                                    }
                                },
                                ports: [{ port: vars.port || 3000 }],
                                environmentVariables: [
                                    { name: "NODE_ENV", value: "[parameters('environment')]" },
                                    { name: "qantum_VERSION", value: core.version }
                                ]
                            }
                        }],
                        osType: "Linux",
                        ipAddress: { type: "Public", ports: [{ port: vars.port || 3000, protocol: "TCP" }] }
                    }
                }
            ]
        }, null, 2);
    }

    private static generateAzureFunctionsTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return JSON.stringify({
            bindings: [{
                type: "httpTrigger",
                direction: "in",
                name: "req",
                methods: ["get", "post"]
            }, {
                type: "http",
                direction: "out",
                name: "res"
            }],
            scriptFile: "../dist/index.js"
        }, null, 2);
    }

    private static generateAzureContainerAppsTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return `apiVersion: apps/v1
kind: ContainerApp
metadata:
  name: QANTUM-mind
spec:
  template:
    containers:
      - name: QANTUM-mind
        image: QANTUM-mind:${core.version}
        resources:
          cpu: ${parseFloat(vars.cpu || '2000') / 1000}
          memory: ${vars.memory || '4096'}Mi
`;
    }

    /**
     * ☁️ Generate GCP Cloud Run Template
     */
    private static generateGCPTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return `apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: QANTUM-mind
  labels:
    app: QANTUM-mind
    version: "${core.version}"
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "${vars.minReplicas || 2}"
        autoscaling.knative.dev/maxScale: "${vars.maxReplicas || 10}"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 900
      containers:
        - image: gcr.io/PROJECT_ID/qantum:${core.version}
          ports:
            - containerPort: ${vars.port || 3000}
          env:
            - name: NODE_ENV
              value: ${vars.environment || 'production'}
            - name: QANTUM_MIND_VERSION
              value: ${core.version}
          resources:
            limits:
              cpu: "${parseFloat(vars.cpu || '2000') / 1000}"
              memory: ${vars.memory || '4096'}Mi
          livenessProbe:
            httpGet:
              path: /health
              port: ${vars.port || 3000}
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: ${vars.port || 3000}
            initialDelaySeconds: 5
            periodSeconds: 10
`;
    }

    private static generateGCPFunctionsTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return `runtime: nodejs20
entryPoint: handler
availableMemoryMb: ${vars.memory || '4096'}
timeout: 540s
environmentVariables:
  NODE_ENV: ${vars.environment || 'production'}
  QANTUM_MIND_VERSION: ${core.version}
`;
    }

    private static generateGKETemplate(core: SingularityCore, vars: Record<string, any>): string {
        return `apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: QANTUM-mind-cluster
spec:
  location: ${vars.region || 'europe-west1'}
  initialNodeCount: 3
  nodeConfig:
    machineType: e2-standard-4
`;
    }

    /**
     * ☸️ Generate Kubernetes Deployment Template
     */
    private static generateKubernetesTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: QANTUM-mind
  labels:
    app: QANTUM-mind
    version: "${core.version}"
spec:
  replicas: ${vars.replicas || 3}
  selector:
    matchLabels:
      app: QANTUM-mind
  template:
    metadata:
      labels:
        app: QANTUM-mind
        version: "${core.version}"
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "${vars.port || 3000}"
        prometheus.io/path: "/metrics"
    spec:
      containers:
        - name: QANTUM-mind
          image: QANTUM-mind:${core.version}
          ports:
            - containerPort: ${vars.port || 3000}
              name: http
          env:
            - name: NODE_ENV
              value: ${vars.environment || 'production'}
            - name: QANTUM_MIND_VERSION
              value: ${core.version}
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "${vars.memory || '4096'}Mi"
              cpu: "${vars.cpu || '2000'}m"
          livenessProbe:
            httpGet:
              path: /health
              port: ${vars.port || 3000}
            initialDelaySeconds: 30
            periodSeconds: 30
            timeoutSeconds: 10
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health
              port: ${vars.port || 3000}
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          volumeMounts:
            - name: screenshots
              mountPath: /app/screenshots
            - name: reports
              mountPath: /app/reports
      volumes:
        - name: screenshots
          emptyDir: {}
        - name: reports
          emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: QANTUM-mind
                topologyKey: kubernetes.io/hostname
`;
    }

    private static generateK8sServiceTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return `apiVersion: v1
kind: Service
metadata:
  name: QANTUM-mind
  labels:
    app: QANTUM-mind
spec:
  type: ClusterIP
  selector:
    app: QANTUM-mind
  ports:
    - port: 80
      targetPort: ${vars.port || 3000}
      name: http
`;
    }

    private static generateK8sConfigMapTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return `apiVersion: v1
kind: ConfigMap
metadata:
  name: QANTUM-mind-config
data:
  NODE_ENV: ${vars.environment || 'production'}
  QANTUM_MIND_VERSION: ${core.version}
  LOG_LEVEL: info
`;
    }

    private static generateK8sIngressTemplate(core: SingularityCore, vars: Record<string, any>): string {
        return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: QANTUM-mind
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: QANTUM-mind.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: QANTUM-mind
                port:
                  number: 80
`;
    }

    private static generateK8sHPATemplate(core: SingularityCore, vars: Record<string, any>): string {
        return `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: QANTUM-mind
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: QANTUM-mind
  minReplicas: ${vars.minReplicas || 2}
  maxReplicas: ${vars.maxReplicas || 10}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
`;
    }

    /**
     * 📊 Get sync statistics
     */
    getStats(): {
        totalTemplates: number;
        lastSync: number;
        providers: Record<string, number>;
        successRate: number;
    } {
        const providerCounts: Record<string, number> = {};
        for (const template of this.templates.values()) {
            providerCounts[template.provider] = (providerCounts[template.provider] || 0) + 1;
        }

        const recent = this.syncHistory.slice(-100);
        const successful = recent.filter(r => r.status !== 'failed').length;

        return {
            totalTemplates: this.templates.size,
            lastSync: recent[recent.length - 1]?.timestamp || 0,
            providers: providerCounts,
            successRate: recent.length > 0 ? successful / recent.length : 1
        };
    }
}

// ============================================================
// EXPORTS
// ============================================================

export function createVirtualMaterialSync(config?: Partial<VirtualMaterialConfig>): VirtualMaterialSyncEngine {
    return new VirtualMaterialSyncEngine(config);
}

export type {
    CloudTemplate,
    SyncResult,
    DeploymentConfig,
    VirtualMaterialConfig
};
