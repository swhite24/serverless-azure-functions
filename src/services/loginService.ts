import open from "open";
import {
  interactiveLoginWithAuthResponse,
  loginWithServicePrincipalSecretWithAuthResponse,
  AuthResponse,

} from "@azure/ms-rest-nodeauth";

export interface AzureLoginOptions {
  subscriptionId?: string;
  clientId?: string;
  tenantId?: string;
  password?: string;
  interactive?: boolean;
}

export class AzureLoginService {
  public static async login(options: AzureLoginOptions = {}): Promise<AuthResponse> {
    if (options.clientId && options.password && options.tenantId) {
      return await AzureLoginService.servicePrincipalLogin(options);
    } else {
      return await AzureLoginService.interactiveLogin();
    }
  }

  public static async interactiveLogin(): Promise<AuthResponse> {
    await open("https://microsoft.com/devicelogin");
    return await interactiveLoginWithAuthResponse();
  }

  public static async servicePrincipalLogin(options: AzureLoginOptions): Promise<AuthResponse> {
    return loginWithServicePrincipalSecretWithAuthResponse(options.clientId, options.password, options.tenantId);
  }
}
