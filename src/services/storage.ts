import Dexie, { type Table } from 'dexie'
import type {
  AppMeta,
  Contact,
  InventoryMovement,
  Product,
  PurchaseOrder,
  Sale,
  StoredFile,
} from '@/types'

const DB_NAME = 'iloc-inventory'
const OPFS_ROOT = 'product-images'
const META_SEEDED_KEY = 'seeded'
const META_PO_COUNTER_KEY = 'po_counter'

export type StorageBackend = 'opfs' | 'dexie'

class InventoryDatabase extends Dexie {
  products!: Table<Product, string>
  sales!: Table<Sale, string>
  inventoryMovements!: Table<InventoryMovement, string>
  contacts!: Table<Contact, string>
  purchaseOrders!: Table<PurchaseOrder, string>
  files!: Table<StoredFile, string>
  meta!: Table<AppMeta, string>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      products: 'id, sku, brand, model, category, stock, updatedAt',
      sales: 'id, date, customerName, createdAt',
      inventoryMovements: 'id, date, type, productId, relatedSaleId',
      orders: 'id, date, status, customerName, createdAt',
      files: 'path, createdAt',
      meta: 'key',
    })
    this.version(2).stores({
      products: 'id, sku, brand, model, category, condition, stock, updatedAt',
      sales: 'id, date, customerName, createdAt',
      inventoryMovements: 'id, date, type, productId, relatedSaleId',
      orders: 'id, date, status, customerName, createdAt',
      files: 'path, createdAt',
      meta: 'key',
    }).upgrade(async (tx) => {
      await tx
        .table('products')
        .toCollection()
        .modify((p: Product) => {
          if (p.category === 'celular' && !p.condition) {
            p.condition = 'nuevo'
          }
        })
    })
    this.version(3).stores({
      products: 'id, sku, brand, model, category, condition, stock, updatedAt',
      sales: 'id, date, contactId, customerName, createdAt',
      inventoryMovements: 'id, date, type, productId, relatedSaleId',
      orders: 'id, date, status, customerName, createdAt',
      contacts: 'id, name, phone, updatedAt',
      files: 'path, createdAt',
      meta: 'key',
    })
    // v4: se elimina el módulo de pedidos (tabla orders) y se clasifica el
    // contacto como cliente/proveedor (campo type, sin índice).
    this.version(4)
      .stores({
        orders: null,
        contacts: 'id, name, type, phone, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('contacts')
          .toCollection()
          .modify((c: Contact) => {
            if (!c.type) c.type = 'customer'
          })
      })
    // v5: módulo de pedidos de compra (reposición de inventario a proveedores).
    this.version(5).stores({
      purchaseOrders: 'id, code, date, supplierId, status, createdAt',
    })
  }
}

export const db = new InventoryDatabase()

let opfsRoot: FileSystemDirectoryHandle | null = null
let storageBackend: StorageBackend = 'dexie'

/** Detecta si OPFS está disponible en el navegador */
export function isOpfsSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'storage' in navigator &&
    typeof navigator.storage.getDirectory === 'function'
  )
}

export function getStorageBackend(): StorageBackend {
  return storageBackend
}

async function initOpfs(): Promise<boolean> {
  if (!isOpfsSupported()) return false
  try {
    const root = await navigator.storage.getDirectory()
    opfsRoot = await root.getDirectoryHandle(OPFS_ROOT, { create: true })
    storageBackend = 'opfs'
    return true
  } catch {
    storageBackend = 'dexie'
    return false
  }
}

export async function initStorage(): Promise<StorageBackend> {
  await db.open()
  await initOpfs()
  return storageBackend
}

// ─── Meta ───────────────────────────────────────────────────────────────────

export async function getMeta(key: string): Promise<string | undefined> {
  const row = await db.meta.get(key)
  return row?.value
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.meta.put({ key, value })
}

export async function isSeeded(): Promise<boolean> {
  return (await getMeta(META_SEEDED_KEY)) === 'true'
}

export async function markSeeded(): Promise<void> {
  await setMeta(META_SEEDED_KEY, 'true')
}

// ─── Products ───────────────────────────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  return db.products.orderBy('updatedAt').reverse().toArray()
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return db.products.get(id)
}

export async function saveProduct(product: Product): Promise<void> {
  await db.products.put(product)
}

export async function deleteProduct(id: string): Promise<void> {
  await db.products.delete(id)
}

// ─── Sales ──────────────────────────────────────────────────────────────────

export async function getAllSales(): Promise<Sale[]> {
  return db.sales.orderBy('date').reverse().toArray()
}

export async function getSaleById(id: string): Promise<Sale | undefined> {
  return db.sales.get(id)
}

export async function saveSale(sale: Sale): Promise<void> {
  await db.sales.put(sale)
}

// ─── Inventory Movements ────────────────────────────────────────────────────

export async function getAllMovements(): Promise<InventoryMovement[]> {
  return db.inventoryMovements.orderBy('date').reverse().toArray()
}

export async function saveMovement(movement: InventoryMovement): Promise<void> {
  await db.inventoryMovements.put(movement)
}

// ─── Contacts ───────────────────────────────────────────────────────────────

export async function getAllContacts(): Promise<Contact[]> {
  return db.contacts.orderBy('name').toArray()
}

export async function getContactById(id: string): Promise<Contact | undefined> {
  return db.contacts.get(id)
}

export async function saveContact(contact: Contact): Promise<void> {
  await db.contacts.put(contact)
}

export async function deleteContact(id: string): Promise<void> {
  await db.contacts.delete(id)
}

// ─── Purchase Orders ─────────────────────────────────────────────────────────

export async function getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
  return db.purchaseOrders.orderBy('createdAt').reverse().toArray()
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | undefined> {
  return db.purchaseOrders.get(id)
}

export async function savePurchaseOrder(order: PurchaseOrder): Promise<void> {
  await db.purchaseOrders.put(order)
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  await db.purchaseOrders.delete(id)
}

/** Genera el siguiente folio consecutivo de orden de compra (OC-0001, OC-0002, …) */
export async function nextPurchaseOrderCode(): Promise<string> {
  const next = Number((await getMeta(META_PO_COUNTER_KEY)) ?? '0') + 1
  await setMeta(META_PO_COUNTER_KEY, String(next))
  return `OC-${String(next).padStart(4, '0')}`
}

export interface ReceivePurchaseOrderData {
  /** Orden con receivedQuantity/estado actualizados y vínculos de producto ya resueltos */
  order: PurchaseOrder
  /** Modelos nuevos a crear en el catálogo */
  newProducts: Product[]
  /** Incrementos de stock/costo para productos existentes */
  stockUpdates: { productId: string; stock: number; cost: number }[]
  /** Movimientos de entrada generados por la recepción */
  movements: InventoryMovement[]
}

export async function executeReceivePurchaseOrder(data: ReceivePurchaseOrderData): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', db.products, db.inventoryMovements, db.purchaseOrders, async () => {
    for (const product of data.newProducts) {
      await db.products.put(product)
    }
    for (const u of data.stockUpdates) {
      await db.products.update(u.productId, { stock: u.stock, cost: u.cost, updatedAt: now })
    }
    for (const movement of data.movements) {
      await db.inventoryMovements.put(movement)
    }
    await db.purchaseOrders.put(data.order)
  })
}

// ─── File Storage (OPFS + Dexie fallback) ───────────────────────────────────

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function saveFile(
  file: File,
  subfolder = 'products',
): Promise<string> {
  const fileName = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
  const path = `${subfolder}/${fileName}`

  if (storageBackend === 'opfs' && opfsRoot) {
    const parts = path.split('/')
    let dir = opfsRoot
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i]!, { create: true })
    }
    const handle = await dir.getFileHandle(parts.at(-1)!, { create: true })
    const writable = await handle.createWritable()
    await writable.write(file)
    await writable.close()
  } else {
    await db.files.put({
      path,
      mimeType: file.type,
      data: file,
      createdAt: new Date().toISOString(),
    })
  }

  return path
}

export async function readFile(path: string): Promise<Blob | null> {
  if (storageBackend === 'opfs' && opfsRoot) {
    try {
      const parts = path.split('/')
      let dir: FileSystemDirectoryHandle = opfsRoot
      for (let i = 0; i < parts.length - 1; i++) {
        dir = await dir.getDirectoryHandle(parts[i]!)
      }
      const handle = await dir.getFileHandle(parts.at(-1)!)
      return await handle.getFile()
    } catch {
      // fallback to dexie
    }
  }

  const stored = await db.files.get(path)
  return stored?.data ?? null
}

export async function getFileUrl(path: string): Promise<string | null> {
  const blob = await readFile(path)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

export async function deleteFile(path: string): Promise<void> {
  if (storageBackend === 'opfs' && opfsRoot) {
    try {
      const parts = path.split('/')
      let dir: FileSystemDirectoryHandle = opfsRoot
      for (let i = 0; i < parts.length - 1; i++) {
        dir = await dir.getDirectoryHandle(parts[i]!)
      }
      await dir.removeEntry(parts.at(-1)!)
      return
    } catch {
      // fallback
    }
  }
  await db.files.delete(path)
}

// ─── Transactions ───────────────────────────────────────────────────────────

export interface SaleTransactionData {
  sale: Sale
  movements: InventoryMovement[]
  stockUpdates: { productId: string; newStock: number }[]
}

export async function executeSaleTransaction(data: SaleTransactionData): Promise<void> {
  await db.transaction('rw', db.products, db.sales, db.inventoryMovements, async () => {
    for (const update of data.stockUpdates) {
      await db.products.update(update.productId, { stock: update.newStock })
    }
    await db.sales.put(data.sale)
    for (const movement of data.movements) {
      await db.inventoryMovements.put(movement)
    }
  })
}

export interface ReturnTransactionData {
  sale: Sale
  movements: InventoryMovement[]
  /** Productos a reingresar al stock (incremento relativo) */
  restock: { productId: string; quantity: number }[]
}

export async function executeReturnTransaction(data: ReturnTransactionData): Promise<void> {
  await db.transaction('rw', db.products, db.sales, db.inventoryMovements, async () => {
    for (const r of data.restock) {
      const product = await db.products.get(r.productId)
      if (product) await db.products.update(r.productId, { stock: product.stock + r.quantity })
    }
    await db.sales.put(data.sale)
    for (const movement of data.movements) {
      await db.inventoryMovements.put(movement)
    }
  })
}

export interface StockAdjustmentData {
  product: Product
  movement: InventoryMovement
}

export async function executeStockAdjustment(data: StockAdjustmentData): Promise<void> {
  await db.transaction('rw', db.products, db.inventoryMovements, async () => {
    await db.products.put(data.product)
    await db.inventoryMovements.put(data.movement)
  })
}

// ─── Export / Import ────────────────────────────────────────────────────────

export interface AppSettingsExport {
  exchangeRate?: number
  showUsd?: boolean
  storeName?: string
  storeDescription?: string
  storePhone?: string
  storeAddress?: string
}

export interface ExportData {
  version: 1
  exportedAt: string
  products: Product[]
  sales: Sale[]
  inventoryMovements: InventoryMovement[]
  contacts?: Contact[]
  purchaseOrders?: PurchaseOrder[]
  settings?: AppSettingsExport
}

export async function exportAllData(): Promise<ExportData> {
  const [products, sales, inventoryMovements, contacts, purchaseOrders] = await Promise.all([
    db.products.toArray(),
    db.sales.toArray(),
    db.inventoryMovements.toArray(),
    db.contacts.toArray(),
    db.purchaseOrders.toArray(),
  ])
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    products,
    sales,
    inventoryMovements,
    contacts,
    purchaseOrders,
  }
}

export async function importAllData(data: ExportData, replace = true): Promise<void> {
  await db.transaction(
    'rw',
    db.products,
    db.sales,
    db.inventoryMovements,
    db.contacts,
    db.purchaseOrders,
    async () => {
      if (replace) {
        await Promise.all([
          db.products.clear(),
          db.sales.clear(),
          db.inventoryMovements.clear(),
          db.contacts.clear(),
          db.purchaseOrders.clear(),
        ])
      }
      await db.products.bulkPut(data.products)
      await db.sales.bulkPut(data.sales)
      await db.inventoryMovements.bulkPut(data.inventoryMovements)
      if (data.contacts?.length) await db.contacts.bulkPut(data.contacts)
      if (data.purchaseOrders?.length) await db.purchaseOrders.bulkPut(data.purchaseOrders)
    },
  )
}

export async function clearAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.products, db.sales, db.inventoryMovements, db.contacts, db.purchaseOrders, db.files],
    async () => {
      await Promise.all([
        db.products.clear(),
        db.sales.clear(),
        db.inventoryMovements.clear(),
        db.contacts.clear(),
        db.purchaseOrders.clear(),
        db.files.clear(),
      ])
    },
  )
  await db.meta.delete(META_SEEDED_KEY)
  await db.meta.delete(META_PO_COUNTER_KEY)
}