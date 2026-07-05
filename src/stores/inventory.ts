import { defineStore } from 'pinia'
import { useInventory } from '@/composables/useInventory'

export const useInventoryStore = defineStore('inventory', () => {
  const inventoryApi = useInventory()
  return { ...inventoryApi }
})