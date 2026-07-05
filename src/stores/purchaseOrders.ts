import { defineStore } from 'pinia'
import { usePurchaseOrders } from '@/composables/usePurchaseOrders'

export const usePurchaseOrdersStore = defineStore('purchaseOrders', () => {
  const purchaseOrdersApi = usePurchaseOrders()
  return { ...purchaseOrdersApi }
})
