<script setup lang="ts">
import { ref, watch, onUnmounted, computed, onMounted } from 'vue'
import type { InventoryTableColumn, InventoryTableSortKey, TableSortState } from '@/types'
import type { Product } from '@/types'
import {
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  GripVertical,
} from 'lucide-vue-next'
import ProductActionsMenu from './ProductActionsMenu.vue'
import { formatCurrency } from '@/utils/format'
import { getFileUrl } from '@/services/storage'
import { DEFAULT_COLUMN_WIDTHS } from '@/composables/useInventoryTableLayout'
import { CONDITION_LABELS } from '@/utils/product'
import { CATEGORY_LABELS } from '@/utils/category'
import CategoryIcon from './CategoryIcon.vue'

const props = defineProps<{
  products: Product[]
  highlightId?: string
  selectedId?: string
  visibleColumns: InventoryTableColumn[]
  columnWidths: Record<InventoryTableColumn, number>
}>()

const sort = defineModel<TableSortState>('sort', { required: true })
const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] })

const selectAllRef = ref<HTMLInputElement | null>(null)

const emit = defineEmits<{
  select: [product: Product]
  edit: [product: Product]
  delete: [product: Product]
  adjustStock: [product: Product]
  reorderColumns: [dragKey: InventoryTableColumn, dropKey: InventoryTableColumn]
  resizeColumn: [key: InventoryTableColumn, width: number]
}>()

const imageUrls = ref<Record<string, string>>({})
const openMenuId = ref<string | null>(null)
const dragColumn = ref<InventoryTableColumn | null>(null)
const dropTarget = ref<InventoryTableColumn | null>(null)
const resizingColumn = ref<InventoryTableColumn | null>(null)

const columnDefs: Record<
  InventoryTableColumn,
  { label: string; align: 'left' | 'right' }
> = {
  product: { label: 'Producto', align: 'left' },
  sku: { label: 'SKU', align: 'left' },
  category: { label: 'Categoría', align: 'left' },
  condition: { label: 'Condición', align: 'left' },
  price: { label: 'Precio', align: 'right' },
  stock: { label: 'Stock', align: 'right' },
}

function conditionBadgeClass(condition?: string): string {
  if (condition === 'segunda_mano') return 'bg-warning/15 text-warning'
  if (condition === 'nuevo') return 'bg-accent/15 text-accent'
  return 'bg-surface-overlay text-zinc-500'
}

const activeColumns = computed(() => {
  const productIdx = props.visibleColumns.indexOf('product')
  const ordered =
    productIdx > 0
      ? ['product' as const, ...props.visibleColumns.filter((c) => c !== 'product')]
      : [...props.visibleColumns]

  return ordered
    .filter((key) => props.visibleColumns.includes(key))
    .map((key) => ({ key, ...columnDefs[key] }))
})

const colspan = computed(() => activeColumns.value.length + 2)

const allSelected = computed(
  () =>
    props.products.length > 0 &&
    props.products.every((p) => selectedIds.value.includes(p.id)),
)

const someSelected = computed(
  () =>
    props.products.some((p) => selectedIds.value.includes(p.id)) && !allSelected.value,
)

watch([someSelected, allSelected], () => {
  if (selectAllRef.value) selectAllRef.value.indeterminate = someSelected.value
})

onMounted(() => {
  if (selectAllRef.value) selectAllRef.value.indeterminate = someSelected.value
})

const tableMinWidth = computed(() => {
  const cols = activeColumns.value.reduce(
    (sum, col) => sum + (props.columnWidths[col.key] ?? DEFAULT_COLUMN_WIDTHS[col.key]),
    76,
  )
  return `${cols}px`
})

function toggleSelectAll() {
  if (allSelected.value) {
    const visible = new Set(props.products.map((p) => p.id))
    selectedIds.value = selectedIds.value.filter((id) => !visible.has(id))
  } else {
    const ids = props.products.map((p) => p.id)
    selectedIds.value = [...new Set([...selectedIds.value, ...ids])]
  }
}

function toggleSelect(id: string) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((i) => i !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

async function loadImages(products: Product[]) {
  for (const p of products) {
    if (p.imagePath && !imageUrls.value[p.id]) {
      const url = await getFileUrl(p.imagePath)
      if (url) imageUrls.value[p.id] = url
    }
  }
}

watch(() => props.products, (list) => loadImages(list), { immediate: true })

onUnmounted(() => {
  Object.values(imageUrls.value).forEach((url) => URL.revokeObjectURL(url))
  stopResize()
})

function isLowStock(product: Product): boolean {
  return product.stock <= (product.minStock ?? 5)
}

function toggleMenu(productId: string) {
  openMenuId.value = openMenuId.value === productId ? null : productId
}

function cycleSort(key: InventoryTableSortKey) {
  if (resizingColumn.value) return
  const { sortBy, sortDir } = sort.value

  if (sortBy !== key) {
    sort.value = { sortBy: key, sortDir: 'asc' }
  } else if (sortDir === 'asc') {
    sort.value = { sortBy: key, sortDir: 'desc' }
  } else {
    sort.value = { sortBy: null, sortDir: null }
  }
}

function sortIcon(key: InventoryTableSortKey) {
  if (sort.value.sortBy !== key) return ArrowUpDown
  return sort.value.sortDir === 'asc' ? ArrowUp : ArrowDown
}

function columnWidth(key: InventoryTableColumn): string {
  const w = props.columnWidths[key] ?? DEFAULT_COLUMN_WIDTHS[key]
  return `${w}px`
}

function cellAlign(align: 'left' | 'right'): string {
  return align === 'right' ? 'text-right' : 'text-left'
}

function cellPadding(key: InventoryTableColumn): string {
  return key === 'product' ? 'py-3 pl-1.5 pr-4' : 'px-4 py-3'
}

// ─── Column resize ───────────────────────────────────────────────────────────

let resizeStartX = 0
let resizeStartWidth = 0
let resizeKey: InventoryTableColumn | null = null

function onResizeStart(key: InventoryTableColumn, event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  resizingColumn.value = key
  resizeKey = key
  resizeStartX = event.clientX
  resizeStartWidth = props.columnWidths[key] ?? DEFAULT_COLUMN_WIDTHS[key]
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
}

function onResizeMove(event: MouseEvent) {
  if (!resizeKey) return
  const delta = event.clientX - resizeStartX
  emit('resizeColumn', resizeKey, resizeStartWidth + delta)
}

function onResizeEnd() {
  stopResize()
}

function stopResize() {
  resizingColumn.value = null
  resizeKey = null
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
}

// ─── Column reorder (drag & drop) ────────────────────────────────────────────

function onDragStart(key: InventoryTableColumn, event: DragEvent) {
  if (key === 'product') {
    event.preventDefault()
    return
  }
  dragColumn.value = key
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', key)
  }
}

function onDragOver(key: InventoryTableColumn, event: DragEvent) {
  if (key === 'product' || !dragColumn.value || dragColumn.value === key) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dropTarget.value = key
}

function onDragLeave(key: InventoryTableColumn) {
  if (dropTarget.value === key) dropTarget.value = null
}

function onDrop(key: InventoryTableColumn, event: DragEvent) {
  event.preventDefault()
  if (!dragColumn.value || key === 'product' || dragColumn.value === key) return
  emit('reorderColumns', dragColumn.value, key)
  dragColumn.value = null
  dropTarget.value = null
}

function onDragEnd() {
  dragColumn.value = null
  dropTarget.value = null
}

function headerClasses(key: InventoryTableColumn, align: 'left' | 'right') {
  const isActive = sort.value.sortBy === key
  const isDrop = dropTarget.value === key
  const isDragging = dragColumn.value === key
  return [
    'group relative select-none px-2 py-3 font-medium transition',
    align === 'right' ? 'text-right' : 'text-left',
    isActive ? 'text-accent' : 'text-zinc-500 hover:text-zinc-300',
    isDrop ? 'bg-accent/10 ring-1 ring-inset ring-accent/40' : '',
    isDragging ? 'opacity-40' : '',
  ]
}
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-border">
    <table class="table-fixed text-left text-sm" :style="{ minWidth: tableMinWidth, width: '100%' }">
      <colgroup>
        <col style="width: 40px" />
        <col style="width: 36px" />
        <col
          v-for="col in activeColumns"
          :key="col.key"
          :style="{ width: columnWidth(col.key) }"
        />
      </colgroup>
      <thead class="border-b border-border bg-surface-overlay text-xs uppercase">
        <tr>
          <th class="py-3 pl-3 pr-1.5">
            <input
              ref="selectAllRef"
              type="checkbox"
              :checked="allSelected"
              @change="toggleSelectAll"
            />
          </th>
          <th class="py-3 px-1.5" />
          <th
            v-for="col in activeColumns"
            :key="col.key"
            :class="headerClasses(col.key, col.align)"
            @dragover="onDragOver(col.key, $event)"
            @dragleave="onDragLeave(col.key)"
            @drop="onDrop(col.key, $event)"
          >
            <div
              class="flex items-center gap-1 pr-2"
              :class="col.align === 'right' ? 'justify-end' : 'justify-start'"
            >
              <span
                v-if="col.key !== 'product'"
                draggable="true"
                class="shrink-0 cursor-grab rounded p-0.5 text-zinc-600 opacity-0 transition hover:bg-surface-overlay active:cursor-grabbing group-hover:opacity-100"
                title="Arrastrar para reordenar"
                @dragstart="onDragStart(col.key, $event)"
                @dragend="onDragEnd"
                @mousedown.stop
              >
                <GripVertical :size="12" />
              </span>
              <button
                type="button"
                class="inline-flex items-center gap-1.5"
                @click="cycleSort(col.key)"
              >
                {{ col.label }}
                <component
                  :is="sortIcon(col.key)"
                  :size="14"
                  class="shrink-0 transition-opacity"
                  :class="
                    sort.sortBy === col.key
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-60'
                  "
                />
              </button>
            </div>
            <div
              class="absolute right-0 top-0 z-10 h-full w-1.5 cursor-col-resize transition hover:bg-accent/60"
              :class="resizingColumn === col.key ? 'bg-accent' : 'bg-transparent'"
              @mousedown="onResizeStart(col.key, $event)"
            />
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        <tr
          v-for="product in products"
          :key="product.id"
          class="cursor-pointer transition hover:bg-surface-overlay/50"
          :class="{
            'bg-accent/5 ring-1 ring-inset ring-accent/30':
              highlightId === product.id || selectedId === product.id,
            'bg-accent/10': selectedIds.includes(product.id),
          }"
          @click="emit('select', product)"
        >
          <td class="py-3 pl-3 pr-1.5" @click.stop>
            <input
              type="checkbox"
              :checked="selectedIds.includes(product.id)"
              @change="toggleSelect(product.id)"
            />
          </td>
          <td class="py-3 px-1.5" @click.stop>
            <ProductActionsMenu
              :open="openMenuId === product.id"
              @toggle="toggleMenu(product.id)"
              @adjust-stock="emit('adjustStock', product)"
              @edit="emit('edit', product)"
              @delete="emit('delete', product)"
            />
          </td>
          <td
            v-for="col in activeColumns"
            :key="col.key"
            class="overflow-hidden"
            :class="[cellAlign(col.align), cellPadding(col.key)]"
          >
            <!-- Producto -->
            <div v-if="col.key === 'product'" class="flex min-w-0 items-center gap-2">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-overlay"
              >
                <img
                  v-if="imageUrls[product.id]"
                  :src="imageUrls[product.id]"
                  :alt="product.model"
                  class="h-full w-full object-cover"
                />
                <CategoryIcon v-else :category="product.category" :size="20" />
              </div>
              <div class="min-w-0">
                <p class="truncate font-medium text-zinc-100">
                  {{ product.brand }} {{ product.model }}
                </p>
                <p v-if="product.variant" class="truncate text-xs text-zinc-500">
                  {{ product.variant }}
                </p>
                <span
                  v-if="product.condition"
                  class="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
                  :class="conditionBadgeClass(product.condition)"
                >
                  {{ CONDITION_LABELS[product.condition] }}
                </span>
              </div>
            </div>

            <!-- SKU -->
            <span
              v-else-if="col.key === 'sku'"
              class="block truncate font-mono text-xs text-zinc-400"
            >
              {{ product.sku ?? '—' }}
            </span>

            <!-- Categoría -->
            <span
              v-else-if="col.key === 'category'"
              class="inline-flex items-center gap-1.5 rounded-md bg-surface-overlay px-2 py-0.5 text-xs text-zinc-300"
            >
              <CategoryIcon :category="product.category" :size="12" />
              {{ CATEGORY_LABELS[product.category] }}
            </span>

            <!-- Condición -->
            <span
              v-else-if="col.key === 'condition'"
              class="inline-block rounded-md px-2 py-0.5 text-xs font-medium"
              :class="
                product.condition
                  ? conditionBadgeClass(product.condition)
                  : 'bg-surface-overlay text-zinc-600'
              "
            >
              {{ product.condition ? CONDITION_LABELS[product.condition] : '—' }}
            </span>

            <!-- Precio -->
            <template v-else-if="col.key === 'price'">
              <span
                v-if="!product.price || product.price <= 0"
                class="inline-flex items-center gap-1 text-warning"
                title="Este producto no tiene precio de venta. Edítalo para poder venderlo."
              >
                <AlertTriangle :size="14" />
                Sin precio
              </span>
              <span v-else class="text-zinc-200">{{ formatCurrency(product.price) }}</span>
            </template>

            <!-- Stock -->
            <span
              v-else-if="col.key === 'stock'"
              class="inline-flex items-center gap-1 font-medium"
              :class="isLowStock(product) ? 'text-warning' : 'text-zinc-200'"
            >
              <AlertTriangle v-if="isLowStock(product)" :size="14" />
              {{ product.stock }}
            </span>
          </td>
        </tr>
        <tr v-if="products.length === 0">
          <td :colspan="colspan" class="px-4 py-12 text-center text-zinc-500">
            No se encontraron productos
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>