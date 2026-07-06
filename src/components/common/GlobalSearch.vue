<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Package, ShoppingCart } from 'lucide-vue-next'
import { useProductsStore } from '@/stores/products'
import { useAppStore } from '@/stores/app'
import { formatCurrency } from '@/utils/format'

const router = useRouter()
const productsStore = useProductsStore()
const appStore = useAppStore()

const query = ref('')
const showResults = ref(false)
const results = ref<ReturnType<typeof productsStore.searchProducts>>([])

watch(query, (q) => {
  appStore.setGlobalSearch(q)
  if (q.trim().length >= 2) {
    results.value = productsStore.searchProducts(q)
    showResults.value = true
  } else {
    results.value = []
    showResults.value = false
  }
})

// Inicia una nueva venta con el producto ya agregado al carrito.
function startSale(id: string) {
  router.push({ name: 'sales', query: { add: id } })
  query.value = ''
  showResults.value = false
}

function goToNewSale() {
  router.push({ name: 'sales' })
  query.value = ''
  showResults.value = false
}

function onBlur() {
  setTimeout(() => {
    showResults.value = false
  }, 200)
}
</script>

<template>
  <div class="relative w-full max-w-md">
    <div class="relative">
      <Search
        :size="16"
        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
      />
      <input
        v-model="query"
        type="search"
        placeholder="Buscar productos"
        class="w-full rounded-lg border border-border bg-surface-overlay py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        @focus="query.length >= 2 && (showResults = true)"
        @blur="onBlur"
        @keydown.enter="goToNewSale"
      />
    </div>

    <div
      v-if="showResults && results.length > 0"
      class="absolute top-full z-40 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface-raised shadow-xl"
    >
      <button
        v-for="product in results"
        :key="product.id"
        type="button"
        class="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="product.stock <= 0"
        :title="product.stock <= 0 ? 'Sin stock disponible' : 'Iniciar venta con este producto'"
        @mousedown.prevent="startSale(product.id)"
      >
        <Package :size="16" class="shrink-0 text-zinc-500" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm text-zinc-100">
            {{ product.brand }} {{ product.model }}
            <span v-if="product.variant" class="text-zinc-400">{{ product.variant }}</span>
          </p>
          <p class="text-xs text-zinc-500">
            Stock: {{ product.stock }} · {{ formatCurrency(product.price) }}
          </p>
        </div>
        <span
          v-if="product.stock > 0"
          class="flex shrink-0 items-center gap-1 text-xs text-accent opacity-0 transition group-hover:opacity-100"
        >
          <ShoppingCart :size="14" />
          Vender
        </span>
      </button>
      <button
        type="button"
        class="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-xs text-accent transition hover:bg-surface-overlay"
        @mousedown.prevent="goToNewSale"
      >
        <ShoppingCart :size="14" />
        Iniciar venta
      </button>
    </div>
  </div>
</template>