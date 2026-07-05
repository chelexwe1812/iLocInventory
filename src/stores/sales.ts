import { defineStore } from 'pinia'
import { useSales } from '@/composables/useSales'

export const useSalesStore = defineStore('sales', () => {
  const salesApi = useSales()
  return { ...salesApi }
})