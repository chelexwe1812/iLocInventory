import Dexie, { type Table } from 'dexie'
import type { AppMeta, Contact, InventoryMovement, Order, Product, Sale, StoredFile } from '@/types'

const DB_NAME = 'iloc-inventory'
const OPFS_ROOT = 'product-images'
const META_SEEDED_KEY = 'seeded'

export type StorageBackend = 'opfs' | 'dexie'

class InventoryDatabase extends Dexie {
  products!: Table<Product, string>
  sales!: Table<Sale, string>
  inventoryMovements!: Table<InventoryMovement, string>
  orders!: Table<Order, string>
  contacts!: Table<Contact, string>
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

// ─── Orders ─────────────────────────────────────────────────────────────────

export async function getAllOrders(): Promise<Order[]> {
  return db.orders.orderBy('createdAt').reverse().toArray()
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  return db.orders.get(id)
}

export async function saveOrder(order: Order): Promise<void> {
  await db.orders.put(order)
}

export async function deleteOrder(id: string): Promise<void> {
  await db.orders.delete(id)
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

export interface ExportData {
  version: 1
  exportedAt: string
  products: Product[]
  sales: Sale[]
  inventoryMovements: InventoryMovement[]
  orders: Order[]
  contacts?: Contact[]
}

export async function exportAllData(): Promise<ExportData> {
  const [products, sales, inventoryMovements, orders, contacts] = await Promise.all([
    db.products.toArray(),
    db.sales.toArray(),
    db.inventoryMovements.toArray(),
    db.orders.toArray(),
    db.contacts.toArray(),
  ])
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    products,
    sales,
    inventoryMovements,
    orders,
    contacts,
  }
}

export async function importAllData(data: ExportData, replace = true): Promise<void> {
  await db.transaction(
    'rw',
    db.products,
    db.sales,
    db.inventoryMovements,
    db.orders,
    db.contacts,
    async () => {
      if (replace) {
        await Promise.all([
          db.products.clear(),
          db.sales.clear(),
          db.inventoryMovements.clear(),
          db.orders.clear(),
          db.contacts.clear(),
        ])
      }
      await db.products.bulkPut(data.products)
      await db.sales.bulkPut(data.sales)
      await db.inventoryMovements.bulkPut(data.inventoryMovements)
      await db.orders.bulkPut(data.orders)
      if (data.contacts?.length) await db.contacts.bulkPut(data.contacts)
    },
  )
}

export async function clearAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.products, db.sales, db.inventoryMovements, db.orders, db.contacts, db.files],
    async () => {
      await Promise.all([
        db.products.clear(),
        db.sales.clear(),
        db.inventoryMovements.clear(),
        db.orders.clear(),
        db.contacts.clear(),
        db.files.clear(),
      ])
    },
  )
  await db.meta.delete(META_SEEDED_KEY)
}