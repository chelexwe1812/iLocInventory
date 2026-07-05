<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Filter } from 'lucide-vue-next'
import InventoryBulkBar from '@/components/inventory/InventoryBulkBar.vue'
import BulkStockAdjustmentModal from '@/components/inventory/BulkStockAdjustmentModal.vue'
import type { Product, ProductFilters, ProductFormData, TableSortState } from '@/types'
import ProductTable from '@/components/inventory/ProductTable.vue'
import ProductTableColumnsMenu from '@/components/inventory/ProductTableColumnsMenu.vue'
import ProductDetailSidebar from '@/components/inventory/ProductDetailSidebar.vue'
import ProductFormModal from '@/components/inventory/ProductFormModal.vue'
import StockAdjustmentModal from '@/components/inventory/StockAdjustmentModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useProductsStore } from '@/stores/products'
import { useInventoryStore } from '@/stores/inventory'
import { useAppStore } from '@/stores/app'
import { useInventoryTableLayout } from '@/composables/useInventoryTableLayout'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/utils/category'

const route = useRoute()
const productsStore = useProductsStore()
const inventoryStore = useInventoryStore()
const appStore = useAppStore()

const {
  visibleColumns,
  columnWidths,
  setColumnWidth,
  reorderColumns,
  toggleColumnVisibility,
} = useInventoryTableLayout()

const filters = ref<ProductFilters>({
  search: '',
  brand: '',
  category: '',
  condition: '',
  lowStockOnly: false,
  sortBy: null,
  sortDir: null,
})

const tableSort = computed<TableSortState>({
  get: () => ({ sortBy: filters.value.sortBy, sortDir: filters.value.sortDir }),
  set: (sort) => {
    filters.value.sortBy = sort.sortBy
    filters.value.sortDir = sort.sortDir
  },
})

const showForm = ref(false)
const showAdjust = ref(false)
const showBulkAdjust = ref(false)
const showDeleteConfirm = ref(false)
const showBulkDeleteConfirm = ref(false)
const showDetail = ref(false)
const selectedProductIds = ref<string[]>([])
const selectedProductId = ref<string | null>(null)
const editingProduct = ref<Product | null>(null)
const adjustingProduct = ref<Product | null>(null)
const deletingProduct = ref<Product | null>(null)

const selectedProduct = computed((): Product | null => {
  if (!selectedProductId.value) return null
  return (
    productsStore.products.find((p) => p.id === selectedProductId.value) ??
    productsStore.getProductById(selectedProductId.value) ??
    null
  )
})

const filteredProducts = computed(() => productsStore.filterProducts(filters.value))

const bulkSelectedProducts = computed(() =>
  productsStore.products.filter((p) => selectedProductIds.value.includes(p.id)),
)

onMounted(async () => {
  if (route.query.q) filters.value.search = String(route.query.q)
  if (route.query.lowStock === '1') filters.value.lowStockOnly = true
  await productsStore.loadProducts()
  if (route.query.highlight) {
    openDetail(String(route.query.highlight))
  }
})

watch(
  () => route.query,
  (q) => {
    if (q.q) filters.value.search = String(q.q)
    if (q.lowStock === '1') filters.value.lowStockOnly = true
  },
)

function openDetail(productOrId: Product | string) {
  const id = typeof productOrId === 'string' ? productOrId : productOrId.id
  selectedProductId.value = id
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
}

function openCreate() {
  editingProduct.value = null
  showForm.value = true
}

function openEdit(product: Product) {
  closeDetail()
  editingProduct.value = product
  showForm.value = true
}

function openAdjust(product: Product) {
  adjustingProduct.value = product
  showAdjust.value = true
}

function openDelete(product: Product) {
  closeDetail()
  deletingProduct.value = product
  showDeleteConfirm.value = true
}

async function handleSave(data: ProductFormData) {
  try {
    if (editingProduct.value) {
      await productsStore.updateProduct(editingProduct.value.id, data)
      appStore.showToast('Producto actualizado', 'success')
    } else {
      await productsStore.createProduct(data)
      appStore.showToast('Producto creado', 'success')
    }
    showForm.value = false
  } catch {
    appStore.showToast('Error al guardar producto', 'error')
  }
}

async function handleAdjust(newStock: number, reason: string, notes?: string) {
  if (!adjustingProduct.value) return
  try {
    await inventoryStore.adjustStock(adjustingProduct.value, newStock, reason, notes)
    await productsStore.loadProducts()
    await inventoryStore.loadMovements()
    appStore.showToast('Stock ajustado correctamente', 'success')
    showAdjust.value = false
  } catch {
    appStore.showToast('Error al ajustar stock', 'error')
  }
}

async function handleDelete() {
  if (!deletingProduct.value) return
  try {
    await productsStore.removeProduct(deletingProduct.value.id)
    selectedProductIds.value = selectedProductIds.value.filter(
      (id) => id !== deletingProduct.value!.id,
    )
    if (selectedProductId.value === deletingProduct.value.id) {
      selectedProductId.value = null
      showDetail.value = false
    }
    appStore.showToast('Producto eliminado', 'success')
  } catch {
    appStore.showToast('Error al eliminar producto', 'error')
  }
}

function openBulkAdjust() {
  if (selectedProductIds.value.length === 0) return
  showBulkAdjust.value = true
}

function openBulkDelete() {
  if (selectedProductIds.value.length === 0) return
  showBulkDeleteConfirm.value = true
}

async function handleBulkAdjust(
  mode: 'set' | 'delta',
  amount: number,
  reason: string,
  notes?: string,
) {
  const products = bulkSelectedProducts.value
  if (products.length === 0) return
  try {
    for (const product of products) {
      const newStock =
        mode === 'set' ? amount : Math.max(0, product.stock + amount)
      if (newStock !== product.stock) {
        await inventoryStore.adjustStock(product, newStock, reason, notes)
      }
    }
    await productsStore.loadProducts()
    await inventoryStore.loadMovements()
    appStore.showToast(`Stock actualizado en ${products.length} productos`, 'success')
    showBulkAdjust.value = false
  } catch {
    appStore.showToast('Error al ajustar stock', 'error')
  }
}

async function handleBulkDelete() {
  const ids = [...selectedProductIds.value]
  if (ids.length === 0) return
  try {
    await productsStore.removeProducts(ids)
    if (selectedProductId.value && ids.includes(selectedProductId.value)) {
      selectedProductId.value = null
      showDetail.value = false
    }
    selectedProductIds.value = []
    appStore.showToast(`${ids.length} producto(s) eliminado(s)`, 'success')
  } catch {
    appStore.showToast('Error al eliminar productos', 'error')
  }
}

const highlightId = computed(() => route.query.highlight as string | undefined)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <input
          v-model="filters.search"
          type="search"
          placeholder="Buscar productos..."
          class="w-64 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <select
          v-model="filters.brand"
          class="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm focus:border-accent focus:outline-none"
        >
          <option value="">Todas las marcas</option>
          <option v-for="brand in productsStore.brands" :key="brand" :value="brand">
            {{ brand }}
          </option>
        </select>
        <select
          v-model="filters.category"
          class="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm focus:border-accent focus:outline-none"
        >
          <option value="">Todas las categorías</option>
          <option
            v-for="cat in ALL_CATEGORIES"
            :key="cat"
            :value="cat"
          >
            {{ CATEGORY_LABELS[cat] }}
          </option>
        </select>
        <select
          v-model="filters.condition"
          class="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm focus:border-accent focus:outline-none"
        >
          <option value="">Todas las condiciones</option>
          <option value="nuevo">Nuevo</option>
          <option value="segunda_mano">Segunda mano</option>
        </select>
        <label class="flex items-center gap-2 text-sm text-zinc-400">
          <input v-model="filters.lowStockOnly" type="checkbox" />
          <Filter :size="14" />
          Stock bajo
        </label>
        <ProductTableColumnsMenu
          :visible-columns="visibleColumns"
          @toggle-column="toggleColumnVisibility"
        />
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        @click="openCreate"
      >
        <Plus :size="16" />
        Nuevo producto
      </button>
    </div>

    <InventoryBulkBar
      v-if="selectedProductIds.length > 0"
      :count="selectedProductIds.length"
      @adjust-stock="openBulkAdjust"
      @delete="openBulkDelete"
      @clear="selectedProductIds = []"
    />

    <p class="text-sm text-zinc-500">
      {{ filteredProducts.length }} producto(s)
    </p>

    <LoadingSpinner v-if="productsStore.loading" label="Cargando inventario..." />

    <ProductTable
      v-else
      v-model:sort="tableSort"
      v-model:selected-ids="selectedProductIds"
      :products="filteredProducts"
      :visible-columns="visibleColumns"
      :column-widths="columnWidths"
      :highlight-id="highlightId"
      :selected-id="selectedProductId ?? undefined"
      @select="openDetail"
      @edit="openEdit"
      @delete="openDelete"
      @adjust-stock="openAdjust"
      @reorder-columns="reorderColumns"
      @resize-column="setColumnWidth"
    />

    <ProductDetailSidebar
      v-model="showDetail"
      :product="selectedProduct"
      @edit="openEdit"
      @adjust-stock="openAdjust"
      @delete="openDelete"
    />

    <ProductFormModal
      v-model="showForm"
      :product="editingProduct"
      @save="handleSave"
    />

    <StockAdjustmentModal
      v-model="showAdjust"
      :product="adjustingProduct"
      @adjust="handleAdjust"
    />

    <BulkStockAdjustmentModal
      v-model="showBulkAdjust"
      :products="bulkSelectedProducts"
      @apply="handleBulkAdjust"
    />

    <ConfirmDialog
      v-model="showDeleteConfirm"
      title="Eliminar producto"
      :message="`¿Eliminar ${deletingProduct?.brand} ${deletingProduct?.model}? Esta acción no se puede deshacer.`"
      confirm-label="Eliminar"
      variant="danger"
      @confirm="handleDelete"
    />

    <ConfirmDialog
      v-model="showBulkDeleteConfirm"
      title="Eliminar productos"
      :message="`¿Eliminar ${selectedProductIds.length} producto(s) seleccionado(s)? Esta acción no se puede deshacer.`"
      confirm-label="Eliminar todos"
      variant="danger"
      @confirm="handleBulkDelete"
    />
  </div>
</template>