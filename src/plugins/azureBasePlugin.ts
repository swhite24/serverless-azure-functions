import { Guard } from "../shared/guard";
import Serverless from "serverless";
import { Utils } from "../shared/utils";
import { ServerlessCommandMap, ServerlessHookMap, ServerlessCliCommand, ServerlessObject } from "../models/serverless";

export abstract class AzureBasePlugin<TOptions=Serverless.Options> {

  public hooks: ServerlessHookMap
  protected commands: ServerlessCommandMap;
  protected originalCommand: ServerlessCliCommand;

  public constructor(
    protected serverless: Serverless,
    protected options: TOptions,
  ) {
    Guard.null(serverless);
    this.originalCommand = (serverless as any as ServerlessObject).processedInput.commands[0]
  }

  protected log(message: string) {
    this.serverless.cli.log(message);
  }

  protected getOption(key: string, defaultValue?: any): string {
    return Utils.get(this.options, key, defaultValue);
  }
}
