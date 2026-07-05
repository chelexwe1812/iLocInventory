import { ref, watch } from 'vue'
import type { InventoryTableColumn } from '@/types'

export const ALL_TABLE_COLUMNS: InventoryTableColumn[] = [
  'product',
  'sku',
  'category',
  'condition',
  'price',
  'stock',
]

export const DEFAULT_COLUMN_WIDTHS: Record<InventoryTableColumn, number> = {
  product: 280,
  sku: 120,
  category: 110,
  condition: 120,
  price: 100,
  stock: 80,
}

const MIN_COLUMN_WIDTH = 64
const MAX_COLUMN_WIDTH = 640

const VISIBLE_COLUMNS_KEY = 'iloc-inventory-visible-columns'
const COLUMN_WIDTHS_KEY = 'iloc-inventory-column-widths'

function isValidColumn(col: string): col is InventoryTableColumn {
  return ALL_TABLE_COLUMNS.includes(col as InventoryTableColumn)
}

export function ensureProductFirst(columns: InventoryTableColumn[]): InventoryTableColumn[] {
  const valid = columns.filter(isValidColumn)
  if (!valid.includes('product')) return valid
  return ['product', ...valid.filter((c) => c !== 'product')]
}

function loadVisibleColumns(): InventoryTableColumn[] {
  try {
    const raw = localStorage.getItem(VISIBLE_COLUMNS_KEY)
    if (!raw) return [...ALL_TABLE_COLUMNS]
    const parsed = JSON.parse(raw) as string[]
    const valid = parsed.filter(isValidColumn)
    const ordered = ensureProductFirst(valid)
    return ordered.length > 0 ? ordered : [...ALL_TABLE_COLUMNS]
  } catch {
    return [...ALL_TABLE_COLUMNS]
  }
}

function loadColumnWidths(): Record<InventoryTableColumn, number> {
  const widths = { ...DEFAULT_COLUMN_WIDTHS }
  try {
    const raw = localStorage.getItem(COLUMN_WIDTHS_KEY)
    if (!raw) return widths
    const parsed = JSON.parse(raw) as Partial<Record<InventoryTableColumn, number>>
    for (const key of ALL_TABLE_COLUMNS) {
      const w = parsed[key]
      if (typeof w === 'number' && w >= MIN_COLUMN_WIDTH) {
        widths[key] = Math.min(w, MAX_COLUMN_WIDTH)
      }
    }
  } catch {
    // defaults
  }
  return widths
}

export function useInventoryTableLayout() {
  const visibleColumns = ref<InventoryTableColumn[]>(loadVisibleColumns())
  const columnWidths = ref<Record<InventoryTableColumn, number>>(loadColumnWidths())

  watch(
    visibleColumns,
    (cols) => {
      localStorage.setItem(VISIBLE_COLUMNS_KEY, JSON.stringify(ensureProductFirst(cols)))
    },
    { deep: true },
  )

  watch(
    columnWidths,
    (widths) => {
      localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(widths))
    },
    { deep: true },
  )

  function getColumnWidth(key: InventoryTableColumn): number {
    return columnWidths.value[key] ?? DEFAULT_COLUMN_WIDTHS[key]
  }

  function setColumnWidth(key: InventoryTableColumn, width: number): void {
    columnWidths.value[key] = Math.min(
      MAX_COLUMN_WIDTH,
      Math.max(MIN_COLUMN_WIDTH, Math.round(width)),
    )
  }

  function reorderColumns(dragKey: InventoryTableColumn, dropKey: InventoryTableColumn): void {
    if (dragKey === 'product' || dropKey === 'product' || dragKey === dropKey) return

    const cols = [...visibleColumns.value]
    const fromIdx = cols.indexOf(dragKey)
    const toIdx = cols.indexOf(dropKey)
    if (fromIdx < 0 || toIdx < 0) return

    cols.splice(fromIdx, 1)
    cols.splice(toIdx, 0, dragKey)
    visibleColumns.value = ensureProductFirst(cols)
  }

  function toggleColumnVisibility(key: InventoryTableColumn): void {
    if (visibleColumns.value.includes(key)) {
      if (visibleColumns.value.length <= 1) return
      visibleColumns.value = visibleColumns.value.filter((c) => c !== key)
    } else {
      visibleColumns.value = ensureProductFirst([...visibleColumns.value, key])
    }
  }

  function isColumnVisible(key: InventoryTableColumn): boolean {
    return visibleColumns.value.includes(key)
  }

  return {
    visibleColumns,
    columnWidths,
    getColumnWidth,
    setColumnWidth,
    reorderColumns,
    toggleColumnVisibility,
    isColumnVisible,
    MIN_COLUMN_WIDTH,
    MAX_COLUMN_WIDTH,
  }
}