export type ProductCategory =
  | 'celular'
  | 'tablet'
  | 'smartwatch'
  | 'computadora'
  | 'accesorio'
  | 'otro'
export type ProductCondition = 'nuevo' | 'segunda_mano'
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'canje' | 'otro'
export type DiscountType = 'percent' | 'fixed'
export type MovementType = 'in' | 'out' | 'adjustment'
export type OrderStatus = 'pending' | 'completed' | 'cancelled'

export interface Product {
  id: string
  sku?: string
  brand: string
  model: string
  variant?: string
  category: ProductCategory
  /** Solo aplica a celulares: inventario por modelo, no por unidad */
  condition?: ProductCondition
  price: number
  cost: number
  stock: number
  minStock?: number
  imei?: string
  specs?: Record<string, unknown>
  imagePath?: string
  createdAt: string
  updatedAt: string
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

/** Equipo recibido a cuenta (canje / trade-in); entra al inventario */
export interface TradeInItem {
  productId: string
  productName: string
  quantity: number
  /** Valor acordado por unidad (crédito otorgado al cliente) */
  unitValue: number
}

export interface Contact {
  id: string
  name: string
  phone?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Sale {
  id: string
  date: string
  /** Contacto asociado a la venta (para el historial de compras del cliente) */
  contactId?: string
  customerName?: string
  customerPhone?: string
  items: SaleItem[]
  /** Total de los productos antes de aplicar descuento */
  subtotal?: number
  discountType?: DiscountType
  /** Valor ingresado por el usuario (porcentaje o monto fijo) */
  discountValue?: number
  /** Monto monetario efectivamente descontado */
  discountAmount?: number
  total: number
  paymentMethod: PaymentMethod
  /** Equipos recibidos a cuenta (canje / trade-in) */
  tradeInItems?: TradeInItem[]
  /** Valor total acordado del canje, que reduce el saldo a pagar */
  tradeInValue?: number
  notes?: string
  createdAt: string
}

export interface InventoryMovement {
  id: string
  date: string
  type: MovementType
  productId: string
  quantity: number
  reason: string
  relatedSaleId?: string
  notes?: string
}

export interface OrderItem {
  productId?: string
  productName: string
  quantity: number
  notes?: string
}

export interface Order {
  id: string
  date: string
  customerName: string
  customerPhone?: string
  items: OrderItem[]
  status: OrderStatus
  notes?: string
  relatedSaleId?: string
  createdAt: string
  updatedAt: string
}

export interface StoredFile {
  path: string
  mimeType: string
  data: Blob
  createdAt: string
}

export interface AppMeta {
  key: string
  value: string
}

export interface DashboardKPIs {
  totalStock: number
  salesToday: number
  salesWeek: number
  lowStockCount: number
  totalRevenue: number
  revenueToday: number
  revenueWeek: number
}

export type InventoryTableColumn =
  | 'product'
  | 'sku'
  | 'category'
  | 'condition'
  | 'price'
  | 'stock'

export type InventoryTableSortKey = InventoryTableColumn

export interface TableSortState {
  sortBy: InventoryTableSortKey | null
  sortDir: 'asc' | 'desc' | null
}

export interface ProductFilters {
  search: string
  brand: string
  category: ProductCategory | ''
  condition: ProductCondition | ''
  lowStockOnly: boolean
  sortBy: InventoryTableSortKey | null
  sortDir: 'asc' | 'desc' | null
}

export interface SaleFilters {
  search: string
  dateFrom: string
  dateTo: string
}

export type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>

export type ContactFormData = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>