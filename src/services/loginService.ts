import open from "open";
import {
  interactiveLoginWithAuthResponse,
  loginWithServicePrincipalSecretWithAuthResponse,
  AuthResponse,
  InteractiveLoginOptions,
  interactiveLogin,
  DeviceTokenCredentials,

} from "@azure/ms-rest-nodeauth";
import { SimpleFileTokenCache } from "../plugins/login/utils/simpleFileTokenCache";

export interface AzureLoginOptions {
  subscriptionId?: string;
  clientId?: string;
  tenantId?: string;
  password?: string;
  interactive?: boolean;
}

export class AzureLoginService {
  public static async login(options: AzureLoginOptions = {}, iOptions?: InteractiveLoginOptions): Promise<AuthResponse> {
    console.log("Asure service options: ")
    console.log(options);
    console.log(iOptions)
    if (options){
      if (options.clientId && options.password && options.tenantId) {
        console.log("wrong")
        console.log(options)
        return await AzureLoginService.servicePrincipalLogin(options);
      }
    } else {
      console.log("correct, here's the options we'll use to log in")
      console.log(iOptions)
      return await AzureLoginService.interactiveLogin(iOptions);
    }
  }

  public static async interactiveLogin(iOptions?: InteractiveLoginOptions): Promise<AuthResponse> {
    console.log("login service options: ");
    console.log(iOptions);
    await open("https://microsoft.com/devicelogin");
    var autResp: AuthResponse;
    if(!(iOptions.tokenCache as SimpleFileTokenCache).empty()){
      console.log("exisitng token");
      var devOptions = {
        tokenCache: iOptions
      }
      autResp.credentials = new DeviceTokenCredentials(devOptions as any);
    } else {
      console.log("need to do interactive login now")
      autResp = await interactiveLoginWithAuthResponse(iOptions); 
    }
    return autResp;//iOptions ? interactiveLoginWithAuthResponse(iOptions) : interactiveLoginWithAuthResponse();
  }

  public static async servicePrincipalLogin(options: AzureLoginOptions): Promise<AuthResponse> {
    return loginWithServicePrincipalSecretWithAuthResponse(options.clientId, options.password, options.tenantId);
  }
}
