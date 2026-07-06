import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router from './router'
import { useStorage } from './composables/useStorage'
import { useTheme } from './composables/useTheme'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Inicializa el tema (aplica preferencia guardada y escucha cambios del sistema).
useTheme()

const { initialize } = useStorage()
initialize().then(() => {
  app.mount('#app')
})

registerSW({
  onNeedRefresh() {
    if (confirm('Nueva versión disponible. ¿Actualizar ahora?')) {
      window.location.reload()
    }
  },
  onOfflineReady() {
    console.info('[PWA] App lista para uso offline')
  },
})