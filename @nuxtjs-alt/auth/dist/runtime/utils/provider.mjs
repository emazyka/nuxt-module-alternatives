import qs from "querystring";
import defu from "defu";
import axios from "axios";
import bodyParser from "body-parser";
import requrl from "requrl";
import { addServerMiddleware } from "@nuxt/kit";
export function assignDefaults(strategy, defaults) {
  Object.assign(strategy, defu(strategy, defaults));
}
export function addAuthorize(strategy, useForms = false) {
  const clientSecret = strategy.clientSecret;
  const clientID = strategy.clientId;
  const tokenEndpoint = strategy.endpoints.token;
  const audience = strategy.audience;
  delete strategy.clientSecret;
  const endpoint = `/_auth/oauth/${strategy.name}/authorize`;
  strategy.endpoints.token = endpoint;
  strategy.responseType = "code";
  const formMiddleware = bodyParser.urlencoded({ extended: true });
  addServerMiddleware({
    route: endpoint,
    handle: (req, res, next) => {
      if (req.method !== "POST") {
        return next();
      }
      formMiddleware(req, res, () => {
        const {
          code,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri = strategy.redirectUri,
          response_type: responseType = strategy.responseType,
          grant_type: grantType = strategy.grantType,
          refresh_token: refreshToken
        } = req.body;
        if (grantType === "authorization_code" && !code) {
          return next();
        }
        if (grantType === "refresh_token" && !refreshToken) {
          return next();
        }
        let data = {
          client_id: clientID,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: grantType,
          response_type: responseType,
          redirect_uri: redirectUri,
          audience,
          code_verifier: codeVerifier,
          code
        };
        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json"
        };
        if (strategy.clientSecretTransport === "authorization_header") {
          headers.Authorization = "Basic " + Buffer.from(clientID + ":" + clientSecret).toString("base64");
          delete data.client_secret;
        }
        if (useForms) {
          data = qs.stringify(data);
          headers["Content-Type"] = "application/x-www-form-urlencoded";
        }
        axios.request({
          method: "post",
          url: tokenEndpoint,
          data,
          headers
        }).then((response) => {
          res.end(JSON.stringify(response.data));
        }).catch((error) => {
          res.statusCode = error.response.status;
          res.end(JSON.stringify(error.response.data));
        });
      });
    }
  });
}
export function initializePasswordGrantFlow(strategy) {
  const clientSecret = strategy.clientSecret;
  const clientId = strategy.clientId;
  const tokenEndpoint = strategy.endpoints.token;
  delete strategy.clientSecret;
  const endpoint = `/_auth/${strategy.name}/token`;
  strategy.endpoints.login.url = endpoint;
  strategy.endpoints.refresh.url = endpoint;
  const formMiddleware = bodyParser.json();
  addServerMiddleware({
    route: endpoint,
    handle: (req, res, next) => {
      if (req.method !== "POST") {
        return next();
      }
      formMiddleware(req, res, () => {
        const data = req.body;
        if (!data.grant_type) {
          data.grant_type = strategy.grantType;
        }
        if (!data.client_id) {
          data.grant_type = clientId;
        }
        if (data.grant_type === "password" && (!data.username || !data.password)) {
          return next(new Error("Invalid username or password"));
        }
        if (data.grant_type === "refresh_token" && !data.refresh_token) {
          return next(new Error("Refresh token not provided"));
        }
        axios.request({
          method: "post",
          url: tokenEndpoint,
          baseURL: requrl(req),
          data: {
            client_id: clientId,
            client_secret: clientSecret,
            ...data
          },
          headers: {
            Accept: "application/json"
          }
        }).then((response) => {
          res.end(JSON.stringify(response.data));
        }).catch((error) => {
          res.statusCode = error.response.status;
          res.end(JSON.stringify(error.response.data));
        });
      });
    }
  });
}
export function assignAbsoluteEndpoints(strategy) {
  const { url, endpoints } = strategy;
  if (endpoints) {
    for (const key of Object.keys(endpoints)) {
      const endpoint = endpoints[key];
      if (endpoint) {
        if (typeof endpoint === "object") {
          if (!endpoint.url || endpoint.url.startsWith(url)) {
            continue;
          }
          ;
          endpoints[key].url = url + endpoint.url;
        } else {
          if (endpoint.startsWith(url)) {
            continue;
          }
          endpoints[key] = url + endpoint;
        }
      }
    }
  }
}
