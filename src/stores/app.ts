import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const globalSearch = ref('')
  const sidebarCollapsed = ref(false)
  const toastMessage = ref<string | null>(null)
  const toastType = ref<'success' | 'error' | 'info'>('info')

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    toastMessage.value = message
    toastType.value = type
    setTimeout(() => {
      toastMessage.value = null
    }, 3500)
  }

  function setGlobalSearch(query: string) {
    globalSearch.value = query
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    globalSearch,
    sidebarCollapsed,
    toastMessage,
    toastType,
    showToast,
    setGlobalSearch,
    toggleSidebar,
  }
})