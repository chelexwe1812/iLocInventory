import { computed, ref } from 'vue'
import type { DiscountType, PaymentMethod, Product, Sale, SaleFilters, SaleItem } from '@/types'
import { executeSaleTransaction, getAllSales } from '@/services/storage'
import { generateId } from '@/utils/id'
import { getConditionLabel } from '@/utils/product'
import { isAfter, isBefore, parseISO, startOfDay, startOfWeek } from 'date-fns'

export interface CartItem {
  product: Product
  quantity: number
}

export interface Discount {
  type: DiscountType
  value: number
}

export interface TradeInEntry {
  product: Product
  quantity: number
  /** Valor acordado por unidad (crédito otorgado al cliente) */
  unitValue: number
}

export function useSales() {
  const sales = ref<Sale[]>([])
  const loading = ref(false)

  async function loadSales(): Promise<void> {
    loading.value = true
    try {
      sales.value = await getAllSales()
    } finally {
      loading.value = false
    }
  }

  function filterSales(filters: SaleFilters): Sale[] {
    let result = [...sales.value]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (s) =>
          s.customerName?.toLowerCase().includes(q) ||
          s.customerPhone?.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.items.some((i) => i.productName.toLowerCase().includes(q)),
      )
    }

    if (filters.dateFrom) {
      const from = startOfDay(parseISO(filters.dateFrom))
      result = result.filter((s) => !isBefore(parseISO(s.date), from))
    }

    if (filters.dateTo) {
      const to = startOfDay(parseISO(filters.dateTo))
      to.setHours(23, 59, 59, 999)
      result = result.filter((s) => !isAfter(parseISO(s.date), to))
    }

    return result
  }

  const salesToday = computed(() => {
    const today = startOfDay(new Date())
    return sales.value.filter((s) => !isBefore(parseISO(s.date), today))
  })

  const salesWeek = computed(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    return sales.value.filter((s) => !isBefore(parseISO(s.date), weekStart))
  })

  const totalRevenue = computed(() => sales.value.reduce((sum, s) => sum + s.total, 0))

  const revenueToday = computed(() => salesToday.value.reduce((sum, s) => sum + s.total, 0))

  const revenueWeek = computed(() => salesWeek.value.reduce((sum, s) => sum + s.total, 0))

  function validateCart(cart: CartItem[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    for (const item of cart) {
      if (item.quantity <= 0) {
        errors.push(`${item.product.brand} ${item.product.model}: cantidad inválida`)
      }
      if (item.quantity > item.product.stock) {
        errors.push(
          `${item.product.brand} ${item.product.model}: stock insuficiente (${item.product.stock} disponibles)`,
        )
      }
    }
    if (cart.length === 0) errors.push('El carrito está vacío')
    return { valid: errors.length === 0, errors }
  }

  /** Total de los productos antes de aplicar cualquier descuento. */
  function cartSubtotal(cart: CartItem[]): number {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }

  /**
   * Monto monetario del descuento, acotado para que nunca sea negativo ni
   * mayor que el subtotal (porcentaje limitado a 0–100%).
   */
  function computeDiscountAmount(subtotal: number, discount?: Discount | null): number {
    if (!discount || !discount.value || discount.value <= 0) return 0
    if (discount.type === 'percent') {
      const pct = Math.min(discount.value, 100)
      return Math.round(subtotal * pct) / 100
    }
    return Math.min(discount.value, subtotal)
  }

  function cartTotal(cart: CartItem[], discount?: Discount | null): number {
    const subtotal = cartSubtotal(cart)
    return subtotal - computeDiscountAmount(subtotal, discount)
  }

  async function createSale(
    cart: CartItem[],
    paymentMethod: PaymentMethod,
    customerName?: string,
    customerPhone?: string,
    notes?: string,
    discount?: Discount | null,
    tradeInItems?: TradeInEntry[] | null,
    contactId?: string,
  ): Promise<Sale> {
    const validation = validateCart(cart)
    if (!validation.valid) throw new Error(validation.errors.join('\n'))

    const now = new Date().toISOString()
    const saleId = generateId()

    const items: SaleItem[] = cart.map((item) => {
      const conditionLabel = getConditionLabel(item.product.condition)
      const conditionSuffix =
        item.product.category === 'celular' && conditionLabel ? ` (${conditionLabel})` : ''
      return {
        productId: item.product.id,
        productName: `${item.product.brand} ${item.product.model}${item.product.variant ? ` ${item.product.variant}` : ''}${conditionSuffix}`,
        quantity: item.quantity,
        unitPrice: item.product.price,
        subtotal: item.product.price * item.quantity,
      }
    })

    const subtotal = cartSubtotal(cart)
    const discountAmount = computeDiscountAmount(subtotal, discount)

    const tradeIns =
      paymentMethod === 'canje' && tradeInItems
        ? tradeInItems.filter((t) => t.quantity > 0)
        : []
    const tradeInTotal = tradeIns.reduce((sum, t) => sum + (t.unitValue || 0) * t.quantity, 0)

    const sale: Sale = {
      id: saleId,
      date: now,
      contactId,
      customerName,
      customerPhone,
      items,
      subtotal,
      discountType: discountAmount > 0 ? discount!.type : undefined,
      discountValue: discountAmount > 0 ? discount!.value : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      total: subtotal - discountAmount,
      paymentMethod,
      tradeInItems: tradeIns.length
        ? tradeIns.map((t) => ({
            productId: t.product.id,
            productName: [t.product.brand, t.product.model, t.product.variant]
              .filter(Boolean)
              .join(' '),
            quantity: t.quantity,
            unitValue: t.unitValue || 0,
          }))
        : undefined,
      tradeInValue: tradeInTotal > 0 ? tradeInTotal : undefined,
      notes,
      createdAt: now,
    }

    const movements = cart.map((item) => ({
      id: generateId(),
      date: now,
      type: 'out' as const,
      productId: item.product.id,
      quantity: item.quantity,
      reason: 'Venta',
      relatedSaleId: saleId,
    }))

    const stockUpdates = cart.map((item) => ({
      productId: item.product.id,
      newStock: item.product.stock - item.quantity,
    }))

    // El equipo recibido a cuenta entra al inventario (stock += cantidad).
    const tradeInMovements = tradeIns.map((t) => ({
      id: generateId(),
      date: now,
      type: 'in' as const,
      productId: t.product.id,
      quantity: t.quantity,
      reason: 'Equipo a cuenta',
      relatedSaleId: saleId,
    }))

    const tradeInStockUpdates = tradeIns.map((t) => ({
      productId: t.product.id,
      newStock: t.product.stock + t.quantity,
    }))

    await executeSaleTransaction({
      sale,
      movements: [...movements, ...tradeInMovements],
      stockUpdates: [...stockUpdates, ...tradeInStockUpdates],
    })
    await loadSales()
    return sale
  }

  return {
    sales,
    loading,
    salesToday,
    salesWeek,
    totalRevenue,
    revenueToday,
    revenueWeek,
    loadSales,
    filterSales,
    validateCart,
    cartSubtotal,
    computeDiscountAmount,
    cartTotal,
    createSale,
  }
}