import { assignDefaults } from "../utils/provider.mjs";
export function google(strategy) {
  const DEFAULTS = {
    scheme: "oauth2",
    endpoints: {
      authorization: "https://accounts.google.com/o/oauth2/auth",
      userInfo: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    scope: ["openid", "profile", "email"]
  };
  assignDefaults(strategy, DEFAULTS);
}
