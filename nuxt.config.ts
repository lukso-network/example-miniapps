// https://nuxt.com/docs/api/configuration/nuxt-config
// @ts-ignore
import { assets } from "@lukso/web-components/tools/assets";
import { copyAssets } from "@lukso/web-components/tools/copy-assets";

copyAssets("./public", assets);

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  css: ["~/assets/styles/main.scss"],
  modules: [
    'nuxt-graphql-client'
  ],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  vue: {
    compilerOptions: {
      sourceMap: true,
      isCustomElement: (tag: string) => {
        return tag.startsWith("lukso-");
      },
    },
  },
  ...({'graphql-client': {
    watch: true,
    autoImport: true,
    functionPrefix: 'Gql',
    documentPaths: ['./'],
    preferGETQueries: false,
    codegen: true,
    clients: {
      default: {
        host: 'https://envio.lukso-mainnet.universal.tech/v1/graphql',
      },
    },
  }} as any),
});
