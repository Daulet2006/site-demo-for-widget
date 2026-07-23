// Mini demo storefront that embeds the AppTeka support widget from the CDN.
// The widget auto-inits from the data-* attributes below (see appteka-widget.js).
// Point it at your backend with NUXT_PUBLIC_API_BASE (REST + /ws origin).
const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      title: 'AppTeka — демо-аптека',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      script: [
        {
          src: 'https://aws-appteka-widget-test-s3.s3.eu-central-1.amazonaws.com/widget/appteka-widget.js',
          defer: true,
          'data-api-base': apiBase,
          'data-theme': 'light',
          'data-lang': 'kz',
          'data-position': 'right',
          'data-primary': '#16a34a', // button/brand color — change to reskin the widget
          'data-animation': 'scale', // open/close: scale | slide | fade | none
          'data-animation-duration': '260', // ms
        },
      ],
    },
  },
})
