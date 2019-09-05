import Serverless from "serverless"
import { ServerlessAzureConfig } from "../models/serverless"
import { AzureNamingService } from "./namingService"
import { Utils } from "../shared/utils"

export class ConfigService {

  private config: ServerlessAzureConfig;
  private configVariableKey = "serverlessAzureConfig";

  public constructor(private serverless: Serverless, private options: Serverless.Options) {
    let config: ServerlessAzureConfig = serverless.variables[this.configVariableKey];
    if (!config) {
      config = this.transformConfig(serverless, options);
      serverless.variables[this.configVariableKey] = config;
    }
    this.config = config
  }

  /**
   * Get the Serverless Azure Config
   */
  public getConfig(): ServerlessAzureConfig {
    return this.config;
  }

  /**
   * Name of Function App Service
   */
  public getServiceName(): string {
    return this.serverless.service["service"];
  }

  /**
   * Transform the Serverless.Service into a Serverless Azure Config
   * @param serverless Serverless object
   * @param options Options from CLI
   */
  private transformConfig(serverless: Serverless, options: Serverless.Options): ServerlessAzureConfig {
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
}
