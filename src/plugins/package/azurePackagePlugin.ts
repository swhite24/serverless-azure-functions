
import Serverless from "serverless";
import AzureProvider from "../../provider/azureProvider";
import { PackageService } from "../../services/packageService";
import { AzureBasePlugin } from "../azureBasePlugin";
import { ServerlessCliCommand, ServerlessObject } from "../../models/serverless";

export class AzurePackagePlugin extends AzureBasePlugin {
  private bindingsCreated: boolean = false;
  private packageService: PackageService;
  public provider: AzureProvider;

  public constructor(serverless: Serverless, options: Serverless.Options) {
    super(serverless, options);
    this.hooks = {
      "before:package:setupProviderConfiguration": this.setupProviderConfiguration.bind(this),
      "before:webpack:package:packageModules": this.webpack.bind(this),
      "after:package:finalize": this.finalize.bind(this),
    };

    this.packageService = new PackageService(this.serverless, this.options);
  }

  private async setupProviderConfiguration(): Promise<void> {
    const providedPackage = this.getOption("package");
    if (this.originalCommand === ServerlessCliCommand.DEPLOY && providedPackage) {
      this.log("Deploying pre-built package. No need to create bindings");
      return;
    }
    this.packageService.cleanUpServerlessDir();
    if (this.originalCommand === ServerlessCliCommand.PACKAGE && providedPackage) {
      this.log(`Building to specific package: ${providedPackage}`);
      // (this.serverless as any as ServerlessObject).service.package.artifact = providedPackage;
      (this.serverless as any as ServerlessObject).config.packagePath = providedPackage;
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
