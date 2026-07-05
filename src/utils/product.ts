import type { Product, ProductCondition } from '@/types'

export const CONDITION_LABELS: Record<ProductCondition, string> = {
  nuevo: 'Nuevo',
  segunda_mano: 'Segunda mano',
}

export function getConditionLabel(condition?: ProductCondition): string | null {
  if (!condition) return null
  return CONDITION_LABELS[condition]
}

export function isCelular(product: Pick<Product, 'category'>): boolean {
  return product.category === 'celular'
}