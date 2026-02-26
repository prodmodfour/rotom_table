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

  css: ['~/assets/scss/main.scss', '~/assets/scss/_create-form.scss', '~/assets/scss/components/_create-form-shared.scss', '~/assets/scss/components/_player-view.scss', '~/assets/scss/components/_player-combat-actions.scss', '~/assets/scss/components/_player-character-sheet.scss', '~/assets/scss/components/_form-utilities.scss'],

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
    },
    // Route rules for tunnel-friendly caching and WebSocket
    routeRules: {
      // WebSocket endpoint: no caching, prevent Cloudflare from buffering
      '/ws': {
        headers: {
          'Cache-Control': 'no-store',
          'X-Accel-Buffering': 'no'
        }
      },
      // API endpoints: no caching to ensure fresh data through tunnel
      '/api/**': {
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    }
  },

  vite: {
    // When developing through a Cloudflare Tunnel, Vite HMR needs explicit
    // configuration. Uncomment and set the tunnel hostname:
    // server: {
    //   hmr: {
    //     protocol: 'wss',
    //     host: 'ptu.example.com',  // Your tunnel hostname
    //     clientPort: 443
    //   }
    // },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/_variables.scss" as *; @use "~/assets/scss/_difficulty.scss" as *; @use "~/assets/scss/_pokemon-sheet.scss" as *; @use "~/assets/scss/_modal.scss" as *; @use "~/assets/scss/_sheet.scss" as *;'
        }
      }
    }
  }
})
