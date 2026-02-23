// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: false,

  modules: [
    '@pinia/nuxt',
  ],

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  css: ['~/assets/scss/main.scss'],

  app: {
    head: {
      title: 'PTU Session Helper',
      meta: [
        { name: 'description', content: 'Pokemon Tabletop United 1.05 Session Helper' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  runtimeConfig: {
    public: {
      appName: 'PTU Session Helper'
    }
  },

  nitro: {
    experimental: {
      websocket: true
    }
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/_variables.scss" as *; @use "~/assets/scss/_difficulty.scss" as *; @use "~/assets/scss/_pokemon-sheet.scss" as *; @use "~/assets/scss/_modal.scss" as *; @use "~/assets/scss/_sheet.scss" as *; @use "~/assets/scss/_create-form.scss" as *;'
        }
      }
    }
  }
})
