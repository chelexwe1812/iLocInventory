import { ref } from 'vue'
import type { InventoryMovement, Product } from '@/types'
import { executeStockAdjustment, getAllMovements } from '@/services/storage'
import { generateId } from '@/utils/id'

export function useInventory() {
  const movements = ref<InventoryMovement[]>([])
  const loading = ref(false)

  async function loadMovements(): Promise<void> {
    loading.value = true
    try {
      movements.value = await getAllMovements()
    } finally {
      loading.value = false
    }
  }

  async function adjustStock(
    product: Product,
    newStock: number,
    reason: string,
    notes?: string,
  ): Promise<InventoryMovement> {
    const diff = newStock - product.stock
    const type = diff > 0 ? 'in' : diff < 0 ? 'out' : 'adjustment'

    const movement: InventoryMovement = {
      id: generateId(),
      date: new Date().toISOString(),
      type,
      productId: product.id,
      quantity: Math.abs(diff),
      reason,
      notes,
    }

    const updatedProduct: Product = {
      ...product,
      stock: newStock,
      updatedAt: new Date().toISOString(),
    }

    await executeStockAdjustment({ product: updatedProduct, movement })
    await loadMovements()
    return movement
  }

  function getMovementsForProduct(productId: string): InventoryMovement[] {
    return movements.value.filter((m) => m.productId === productId)
  }

  return {
    movements,
    loading,
    loadMovements,
    adjustStock,
    getMovementsForProduct,
  }
}