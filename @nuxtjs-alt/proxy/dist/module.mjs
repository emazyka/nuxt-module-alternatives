import { defineNuxtModule, addServerMiddleware } from '@nuxt/kit';
import { resolve } from 'path';
import fs from 'fs-extra';

const name = "@nuxtjs-alt/proxy";
const version = "1.0.2";

function getProxyEntries(proxyOptions, defaults) {
  const applyDefaults = (opts) => ({ ...defaults, ...opts });
  const normalizeTarget = (input) => typeof input === "object" ? input : { target: input };
  const proxyEntries = [];
  if (!proxyOptions) {
    return proxyEntries;
  }
  if (!Array.isArray(proxyOptions)) {
    for (const key in proxyOptions) {
      proxyEntries.push({
        context: key,
        options: applyDefaults(normalizeTarget(proxyOptions[key]))
      });
    }
    return proxyEntries;
  }
  for (const input of proxyOptions) {
    if (Array.isArray(input)) {
      proxyEntries.push({
        context: input[0],
        options: applyDefaults(normalizeTarget(input[1]))
      });
    } else {
      proxyEntries.push({
        context: input,
        options: applyDefaults()
      });
    }
  }
  return proxyEntries;
}

const CONFIG_KEY = "proxy";
const module = defineNuxtModule({
  meta: {
    name,
    version,
    configKey: CONFIG_KEY,
    compatibility: {
      nuxt: "^3.0.0"
    }
  },
  async setup(options, nuxt) {
    const defaults = {
      changeOrigin: true,
      ws: true,
      ...options
    };
    const proxyEntries = getProxyEntries(options, defaults);
    Object.values(proxyEntries).forEach(async (proxyEntry, index) => {
      const filePath = resolve(nuxt.options.srcDir, `proxy-middleware/proxy-${index}.ts`);
      fs.outputFile(filePath, proxyContents(proxyEntry)).then(() => {
        addServerMiddleware(filePath);
      }).catch((err) => {
        console.error(err);
      });
    });
  }
});
const proxyContents = (entry) => {
  return `
import type { IncomingMessage, ServerResponse } from 'http'
import { createProxyMiddleware } from 'http-proxy-middleware'

const middleware = createProxyMiddleware('${entry.context}', ${JSON.stringify(entry.options)})

export default async (req: IncomingMessage, res: ServerResponse) => {

    await new Promise<void>((resolve, reject) => {
        const next = (err?: unknown) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        }

        middleware(req, res, next)
    })
}`;
};

export { module as default };