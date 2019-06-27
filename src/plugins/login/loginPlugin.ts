import _ from "lodash";
import Serverless from "serverless";
import { AzureLoginService, AzureLoginOptions } from "../../services/loginService";
import { ServerlessCommandMap } from "../../models/serverless";
import fs from "fs";
import os from "os";

export class AzureLoginPlugin {
  public hooks: { [eventName: string]: Promise<any> };
  public commands: ServerlessCommandMap;

  public constructor(private serverless: Serverless, private options: Serverless.Options & AzureLoginOptions) {
    this.hooks = {
      "before:package:initialize": this.login.bind(this),
      "before:deploy:list:list": this.login.bind(this),
      "login:initialize": this.initialize.bind(this),
      "login:login": this.login.bind(this),
      "login:list:list": this.listSubscriptions.bind(this),
    };

    this.commands = {
      login: {
        usage: "Logs in to the Azure provider",
        lifecycleEvents: ["initialize", "login"],
        options: {
          subscriptionId: {
            usage: "Sets the Azure subscription ID",
            shortcut: "s",
          },
          tenantId: {
            usage: "Sets the Azure tenant ID",
            shortcut: "t",
          },
          clientId: {
            usage: "Sets the service principal client ID",
            shortcut: "c"
          },
          password: {
            usage: "Sets the service principal password",
            shortcut: "p"
          },
          interactive: {
            usage: "Forces an interactive login",
            shortcut: "i"
          }
        },
        commands: {
          list: {
            usage: "Lists the Azure subscriptions based on your logged in credentials",
            lifecycleEvents: ["initialize", "list"]
          }
        },
      },
    };
  }

  private async initialize() {
    const envFile = [];
    if (this.options.subscriptionId) {
      envFile.push(`azureSubId=${this.options.subscriptionId}`);
    }
    if (this.options.clientId) {
      envFile.push(`azureServicePrincipalClientId=${this.options.clientId}`);
    }
    if (this.options.tenantId) {
      envFile.push(`azureServicePrincipalTenantId=${this.options.tenantId}`);
    }
    if (this.options.password) {
      envFile.push(`azureServicePrincipalPassword=${this.options.password}`);
    }

    if (envFile.length && !fs.existsSync(".env")) {
      fs.writeFileSync(".env", envFile.join(os.EOL));
    }
  }

  private getLoginOptions(): AzureLoginOptions {
    return {
      subscriptionId: this.options.subscriptionId || process.env.azureSubId,
      clientId: this.options.clientId || process.env.azureServicePrincipalClientId,
      tenantId: this.options.tenantId || process.env.azureServicePrincipalTenantId,
      password: this.options.password || process.env.azureServicePrincipalPassword,
    };
  }

  private async listSubscriptions() {
    const loginOptions = this.getLoginOptions();

    const authResult = this.options.interactive
      ? await AzureLoginService.login(loginOptions)
      : await AzureLoginService.login();

    if (!(authResult.subscriptions && authResult.subscriptions.length)) {
      this.serverless.cli.log("No Azure subscriptions were found")
    }

    const subscriptions = _.uniqBy(authResult.subscriptions, s => s.id);
    subscriptions.forEach((subscription) => {
      this.serverless.cli.log(`${subscription.id}\t${subscription.name}\t${subscription.state}\t${subscription.environmentName}`);
    });
  }

  private async login() {
    // If credentials have already been set then short circuit
    if (this.serverless.variables["azureCredentials"]) {
      return;
    }

    this.serverless.cli.log("Logging into Azure...");

    const loginOptions = this.getLoginOptions();

    try {
      const authResult = this.options.interactive
        ? await AzureLoginService.login()
        : await AzureLoginService.login(loginOptions);

      // Use environment variable for sub ID or use the first subscription in the list (service principal can
      // have access to more than one subscription)
      const subscriptionId = loginOptions.subscriptionId || this.serverless.service.provider["subscriptionId"] || authResult.subscriptions[0].id;
      this.serverless.variables["azureCredentials"] = authResult.credentials;
      this.serverless.variables["subscriptionId"] = subscriptionId;

      this.serverless.cli.log("-> Successfully logged into Azure");
      this.serverless.cli.log(`-> Using subscription id: ${subscriptionId}`);
    }
    catch (e) {
      this.serverless.cli.log("Error logging into azure");
      this.serverless.cli.log(`${e}`);
    }
  }
}