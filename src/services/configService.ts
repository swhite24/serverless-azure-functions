import Serverless from "serverless"
import { ServerlessAzureConfig, DeploymentConfig } from "../models/serverless"
import { AzureNamingService } from "./namingService"
import { Utils } from "../shared/utils"
import configConstants from "../config";
import { Guard } from "../shared/guard";

export class ConfigService {

  /**
   * Get transformed Serverless config. Adds default values if not populated
   * @param serverless Serverless object
   * @param options Serverless CLI options
   */
  public static getConfig(serverless: Serverless, options?: Serverless.Options): ServerlessAzureConfig {
    const key = configConstants.variableKeys.serverlessAzureConfig
    let config: ServerlessAzureConfig = serverless.variables[key];
    if (!config) {
      config = this.transformConfig(serverless, options);
      serverless.variables[key] = config;
    }
    return config;
  }

  /**
   * Deployment config from `serverless.yml` or default.
   * Defaults can be found in the `config.ts` file
   */
  public static getDeploymentConfig(serverless: Serverless): DeploymentConfig {
    const key = configConstants.variableKeys.deploymentConfig;
    let deploymentConfig: DeploymentConfig = serverless.variables[key];
    if (!deploymentConfig) {
      const config = this.getConfig(serverless);
      deploymentConfig = {
        ...configConstants.deploymentConfig,
        ...config.provider.deployment,
      }
    }
    return deploymentConfig;
  }

  /**
   * Name of current ARM deployment.
   *
   * Naming convention:
   *
   * {safeName (see naming service)}--{serviceName}(if rollback enabled: -t{timestamp})
   *
   * The string is guaranteed to be less than 64 characters, since that is the limit
   * imposed by Azure deployment names. If a trim is needed, the service name will be trimmed
   */
  public static getDeploymentName(serverless: Serverless): string {
    const config = this.getConfig(serverless);
    return AzureNamingService.getDeploymentName(
      config,
      (this.getDeploymentConfig(serverless).rollback) ? `t${this.getTimestamp(serverless)}` : null
    )
  }

  /**
   * Get rollback-configured artifact name. Contains `-t{timestamp}`
   * Takes name of deployment and replaces `rg-deployment` or `deployment` with `artifact`
   */
  public static getArtifactName(deploymentName: string): string {
    const { deployment, artifact } = configConstants.naming.suffix;
    return `${deploymentName
      .replace(`rg-${deployment}`, artifact)
      .replace(deployment, artifact)}.zip`
  }
  /**
   * Transform the Serverless.Service into a Serverless Azure Config
   * @param serverless Serverless object
   * @param options Options from CLI
   */
  private static transformConfig(serverless: Serverless, options: Serverless.Options): ServerlessAzureConfig {
    Guard.null(options, "Serverless.Options", "Config has not yet been initialized");
    this.setDefaultValues(serverless);
    const config: ServerlessAzureConfig = serverless.service as any;
    const { prefix, region, stage, subscriptionId } = config.provider;

    config.provider = {
      ...config.provider,
      prefix: Utils.get(options, "prefix") || prefix,
      stage: Utils.get(options, "stage") || stage,
      region: Utils.get(options, "region") || region,
      subscriptionId: Utils.get(options, "subscriptionId")
        || process.env.azureSubId
        || subscriptionId
        || serverless.variables["subscriptionId"]
    }
    config.provider.resourceGroup = (
      Utils.get(options,"resourceGroup", config.provider.resourceGroup)
    ) || AzureNamingService.getResourceName(config, null, `${serverless.service["service"]}-rg`);

    return config;
  }

  /**
   * Get timestamp from `packageTimestamp` serverless variable
   * If not set, create timestamp, set variable and return timestamp
   */
  private static getTimestamp(serverless: Serverless): number {
    const key = configConstants.variableKeys.packageTimestamp;
    let timestamp = +serverless.variables[key];
    if (!timestamp) {
      timestamp = Date.now();
      serverless.variables[key] = timestamp;
    }
    return timestamp;
  }

  private static setDefaultValues(serverless: Serverless) {
    // TODO: Right now the serverless core will always default to AWS default region if the
    // region has not been set in the serverless.yml or CLI options
    const awsDefault = "us-east-1";
    const providerRegion = serverless.service.provider.region;

    if (!providerRegion || providerRegion === awsDefault) {
      // no region specified in serverless.yml
      serverless.service.provider.region = serverless.service.provider["location"] || "westus";
    }

    if (!serverless.service.provider.stage) {
      serverless.service.provider.stage = "dev";
    }

    if (!serverless.service.provider["prefix"]) {
      serverless.service.provider["prefix"] = "sls";
    }
  }
}
