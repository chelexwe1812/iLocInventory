import { defineStore } from 'pinia'
import { useOrders } from '@/composables/useOrders'

export const useOrdersStore = defineStore('orders', () => {
  const ordersApi = useOrders()
  return { ...ordersApi }
})