import open from "open";
import {
  interactiveLoginWithAuthResponse,
  loginWithServicePrincipalSecretWithAuthResponse,
  AuthResponse,
  InteractiveLoginOptions,

} from "@azure/ms-rest-nodeauth";

export interface AzureLoginOptions {
  subscriptionId?: string;
  clientId?: string;
  tenantId?: string;
  password?: string;
  interactive?: boolean;
}

export class AzureLoginService {
  public static async login(options: AzureLoginOptions = {}, iOptions?: InteractiveLoginOptions): Promise<AuthResponse> {
    if (options.clientId && options.password && options.tenantId) {
      return await AzureLoginService.servicePrincipalLogin(options);
    } else {
      return await AzureLoginService.interactiveLogin(iOptions);
    }
  }

  public static async interactiveLogin(iOptions?: InteractiveLoginOptions): Promise<AuthResponse> {
    await open("https://microsoft.com/devicelogin");
    return await iOptions ? interactiveLoginWithAuthResponse(iOptions) : interactiveLoginWithAuthResponse();
  }

  public static async servicePrincipalLogin(options: AzureLoginOptions): Promise<AuthResponse> {
    return loginWithServicePrincipalSecretWithAuthResponse(options.clientId, options.password, options.tenantId);
  }
}
