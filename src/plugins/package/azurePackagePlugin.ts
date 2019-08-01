
import Serverless from "serverless";
import { ServerlessAzureProvider, ServerlessFunctionRuntime } from "../../models/serverless";
import AzureProvider from "../../provider/azureProvider";
import { PackageService } from "../../services/packageService";
import { AzureBasePlugin } from "../azureBasePlugin";

export class AzurePackagePlugin extends AzureBasePlugin {
  private bindingsCreated: boolean = false;
  private packageService: PackageService;
  public provider: AzureProvider;
  public hooks: { [eventName: string]: Promise<any> };

  public constructor(serverless: Serverless, options: Serverless.Options) {
    super(serverless, options);
    this.hooks = {
      "before:package:setupProviderConfiguration": this.setupProviderConfiguration.bind(this),
      "before:webpack:package:packageModules": this.webpack.bind(this),
      "after:package:finalize": this.finalize.bind(this),
    };

    if ((this.serverless.service.provider as ServerlessAzureProvider).runtime === ServerlessFunctionRuntime.Python) {
      this.log("Got python")
      this.hooks["package:compileFunctions"] = this.pythonPackage.bind(this);
    } else {
      this.log("did not get python")
    }

    this.log(JSON.stringify(this.hooks, null, 2));

    this.packageService = new PackageService(this.serverless, this.options);
  }

  private async pythonPackage() {
    this.log("Packaging python");
  }

  private async setupProviderConfiguration(): Promise<void> {
    if (this.getOption("package")) {
      this.log("No need to create bindings. Using pre-existing package");
      return Promise.resolve();
    }
    await this.packageService.createBindings();
    this.bindingsCreated = true;

    return Promise.resolve();
  }

  private async webpack(): Promise<void> {
    if (this.getOption("package")) {
      this.log("No need to perform webpack. Using pre-existing package");
      return Promise.resolve();
    }
    if (!this.bindingsCreated) {
      await this.setupProviderConfiguration();
    }

    await this.packageService.prepareWebpack();
  }

  /**
   * Cleans up generated folders & files after packaging is complete
   */
  private async finalize(): Promise<void> {
    if (this.getOption("package")) {
      this.log("No need to clean up generated folders & files. Using pre-existing package");
      return Promise.resolve();
    }
    await this.packageService.cleanUp();
  }
}
