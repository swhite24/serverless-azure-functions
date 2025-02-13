import { ArmResourceTemplate, ArmResourceTemplateGenerator, ArmParamType, ArmParameters } from "../../models/armTemplates";
import { ResourceConfig, ServerlessAzureConfig } from "../../models/serverless";
import { AzureNamingService, AzureNamingServiceOptions } from "../../services/namingService";

export class AppServicePlanResource implements ArmResourceTemplateGenerator {
  public static getResourceName(config: ServerlessAzureConfig) {
    const options: AzureNamingServiceOptions = {
      config,
      resourceConfig: config.provider.appServicePlan,
      suffix: "asp",
    }
    return AzureNamingService.getResourceName(options);
  }

  public getTemplate(): ArmResourceTemplate {
    return {
      "$schema": "https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#",
      "contentVersion": "1.0.0.0",
      "parameters": {
        "appServicePlanName": {
          "defaultValue": "",
          "type": ArmParamType.String
        },
        "location": {
          "defaultValue": "",
          "type": ArmParamType.String
        },
        "appServicePlanSkuName": {
          "defaultValue": "EP1",
          "type": ArmParamType.String
        },
        "appServicePlanSkuTier": {
          "defaultValue": "ElasticPremium",
          "type": ArmParamType.String
        }
      },
      "variables": {},
      "resources": [
        {
          "apiVersion": "2016-09-01",
          "name": "[parameters('appServicePlanName')]",
          "type": "Microsoft.Web/serverfarms",
          "location": "[parameters('location')]",
          "properties": {
            "name": "[parameters('appServicePlanName')]",
            "workerSizeId": "3",
            "numberOfWorkers": "1",
            "maximumElasticWorkerCount": "10",
            "reserved": true
          },
          "sku": {
            "name": "[parameters('appServicePlanSkuName')]",
            "tier": "[parameters('appServicePlanSkuTier')]"
          }
        }
      ]
    };
  }

  public getParameters(config: ServerlessAzureConfig): ArmParameters {
    const resourceConfig: ResourceConfig = {
      sku: {},
      ...config.provider.appServicePlan,
    };

    return {
      appServicePlanName: {
        value: AppServicePlanResource.getResourceName(config),
      },
      appServicePlanSkuName: {
        value: resourceConfig.sku.name,
      },
      appServicePlanSkuTier: {
        value: resourceConfig.sku.tier,
      }
    }
  }
}
