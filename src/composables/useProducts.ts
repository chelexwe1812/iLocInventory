import { computed, ref } from 'vue'
import type { Product, ProductFilters, ProductFormData } from '@/types'
import {
  deleteProduct as dbDeleteProduct,
  getAllProducts,
  saveProduct,
} from '@/services/storage'
import { generateId } from '@/utils/id'

export function useProducts() {
  const products = ref<Product[]>([])
  const loading = ref(false)

  async function loadProducts(): Promise<void> {
    loading.value = true
    try {
      products.value = await getAllProducts()
    } finally {
      loading.value = false
    }
  }

  function filterProducts(filters: ProductFilters): Product[] {
    let result = [...products.value]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (p) =>
          p.brand.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          p.variant?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.imei?.toLowerCase().includes(q),
      )
    }

    if (filters.brand) {
      result = result.filter((p) => p.brand === filters.brand)
    }

    if (filters.category) {
      result = result.filter((p) => p.category === filters.category)
    }

    if (filters.condition) {
      result = result.filter((p) => p.condition === filters.condition)
    }

    if (filters.lowStockOnly) {
      result = result.filter((p) => p.stock <= (p.minStock ?? 5))
    }

    if (filters.sortBy && filters.sortDir) {
      const dir = filters.sortDir === 'asc' ? 1 : -1
      result.sort((a, b) => compareProducts(a, b, filters.sortBy!, dir))
    }

    return result
  }

  function getProductDisplayName(product: Product): string {
    return [product.brand, product.model, product.variant].filter(Boolean).join(' ')
  }

  function compareProducts(a: Product, b: Product, key: ProductFilters['sortBy'], dir: number): number {
    if (!key) return 0

    if (key === 'product') {
      return getProductDisplayName(a).localeCompare(getProductDisplayName(b), 'es', { sensitivity: 'base' }) * dir
    }

    if (key === 'condition') {
      const av = a.condition ?? ''
      const bv = b.condition ?? ''
      return String(av).localeCompare(String(bv), 'es', { sensitivity: 'base' }) * dir
    }

    const av = a[key] ?? ''
    const bv = b[key] ?? ''
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv), 'es', { sensitivity: 'base' }) * dir
  }

  const brands = computed(() => [...new Set(products.value.map((p) => p.brand))].sort())

  const lowStockProducts = computed(() =>
    products.value.filter((p) => p.stock <= (p.minStock ?? 5)),
  )

  const totalStock = computed(() => products.value.reduce((sum, p) => sum + p.stock, 0))

  async function createProduct(data: ProductFormData): Promise<Product> {
    const now = new Date().toISOString()
    const payload = { ...data }
    if (payload.category === 'celular' && !payload.condition) {
      payload.condition = 'nuevo'
    }
    // No se borra la condición en otras categorías: un equipo recibido a cuenta
    // (canje) puede ser un iPad/Mac/etc. y debe conservar su condición.
    const product: Product = {
      ...payload,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    await saveProduct(product)
    await loadProducts()
    return product
  }

  async function updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product> {
    const existing = products.value.find((p) => p.id === id)
    if (!existing) throw new Error('Producto no encontrado')

    const updated: Product = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    await saveProduct(updated)
    await loadProducts()
    return updated
  }

  async function removeProduct(id: string): Promise<void> {
    await dbDeleteProduct(id)
    await loadProducts()
  }

  async function removeProducts(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => dbDeleteProduct(id)))
    await loadProducts()
  }

  function getProductById(id: string): Product | undefined {
    return products.value.find((p) => p.id === id)
  }

  function searchProducts(query: string): Product[] {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return products.value
      .filter(
        (p) =>
          p.brand.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          p.variant?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q),
      )
      .slice(0, 10)
  }

  return {
    products,
    loading,
    brands,
    lowStockProducts,
    totalStock,
    loadProducts,
    filterProducts,
    createProduct,
    updateProduct,
    removeProduct,
    removeProducts,
    getProductById,
    searchProducts,
  }
}