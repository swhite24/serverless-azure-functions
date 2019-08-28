import { ApiManagementConfig } from "./apiManagement";
import Serverless from "serverless";
import Service from "serverless/classes/Service";

export interface ArmTemplateConfig {
  file: string;
  parameters:
  {
    [key: string]: string;
  };
}

export interface ResourceConfig {
  name: string;
  sku?: {
    name?: string;
    tier?: string;
  };
  [key: string]: any;
}

export interface FunctionAppConfig extends ResourceConfig {
  nodeVersion?: string;
  workerRuntime?: string;
  extensionVersion?;
}

export interface DeploymentConfig {
  rollback?: boolean;
  container?: string;
  runFromBlobUrl?: boolean;
}

export interface ServerlessAzureProvider {
  type?: string;
  prefix?: string;
  region: string;
  stage: string;
  name: string;
  environment?: {
    [key: string]: any;
  };
  deployment?: DeploymentConfig;
  deploymentName?: string;
  resourceGroup?: string;
  apim?: ApiManagementConfig;
  functionApp?: FunctionAppConfig;
  appInsights?: ResourceConfig;
  appServicePlan?: ResourceConfig;
  storageAccount?: ResourceConfig;
  hostingEnvironment?: ResourceConfig;
  virtualNetwork?: ResourceConfig;
  armTemplate?: ArmTemplateConfig;
  runtime: string;
}

export class ServerlessClass extends Serverless {
  public processedInput: {
    commands: ServerlessCliCommand[];
    options: any;
  }
  public service: ServerlessServiceClass;
}

export class ServerlessServiceClass extends Service {
  public package: {
    individually: boolean;
    artifactDirectoryName: string;
    artifact: string;
  }
}

export enum ServerlessCliCommand {
  PACKAGE = "package",
  DEPLOY = "deploy",
  INVOKE = "invoke",
  ROLLBACK = "rollback",
  OFFLINE = "offline",
  LIST = "list",
}

export interface ServerlessAzureConfig {
  service: string;
  provider: ServerlessAzureProvider;
  plugins: string[];
  functions: any;
}

export interface ServerlessAzureFunctionConfig {
  handler: string;
  events: ServerlessAzureFunctionBindingConfig[];
}

export interface ServerlessAzureFunctionBindingConfig {
  http?: boolean;
  "x-azure-settings": ServerlessExtraAzureSettingsConfig;
}

export interface ServerlessExtraAzureSettingsConfig {
  direction?: string;
  route?: string;
  name?: string;
  authLevel?: string;
}

export interface ServerlessCommand {
  usage: string;
  lifecycleEvents: string[];
  options?: {
    [key: string]: {
      usage: string;
      shortcut?: string;
    };
  };
  commands?: ServerlessCommandMap;
}

export interface ServerlessHookMap {
  [eventName: string]: Promise<any>;
}

export interface ServerlessCommandMap {
  [command: string]: ServerlessCommand;
}

export interface ServerlessAzureOptions extends Serverless.Options {
  resourceGroup?: string;
}

export interface ServerlessLogOptions {
  underline?: boolean;
  bold?: boolean;
  color?: string;
}
