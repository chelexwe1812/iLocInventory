import { defineStore } from 'pinia'
import { useProducts } from '@/composables/useProducts'

export const useProductsStore = defineStore('products', () => {
  const productsApi = useProducts()
  return { ...productsApi }
})