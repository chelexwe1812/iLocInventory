<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Sale, SaleFilters } from '@/types'
import SaleHistoryTable from '@/components/sales/SaleHistoryTable.vue'
import SaleDetailSidebar from '@/components/sales/SaleDetailSidebar.vue'
import SaleEditModal from '@/components/sales/SaleEditModal.vue'
import CreditPaymentModal from '@/components/sales/CreditPaymentModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useSalesStore } from '@/stores/sales'
import { formatCurrency } from '@/utils/format'
import { format, subDays } from 'date-fns'

const salesStore = useSalesStore()

const filters = ref<SaleFilters>({
  search: '',
  dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  dateTo: format(new Date(), 'yyyy-MM-dd'),
})

const filteredSales = computed(() => salesStore.filterSales(filters.value))

const pendingSales = computed(() =>
  filteredSales.value.filter(
    (s) => s.paymentMethod === 'credito' && !s.creditPaid && (s.creditBalance ?? 0) > 0,
  ),
)
const pendingTotal = computed(() =>
  pendingSales.value.reduce((sum, s) => sum + (s.creditBalance ?? 0), 0),
)

const selectedSale = ref<Sale | null>(null)
const detailOpen = ref(false)
const editOpen = ref(false)
const payOpen = ref(false)

function openSale(sale: Sale) {
  selectedSale.value = sale
  detailOpen.value = true
}

function onSaleSaved(updated: Sale) {
  selectedSale.value = updated
}

onMounted(() => salesStore.loadSales())
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <input
        v-model="filters.search"
        type="search"
        placeholder="Buscar por cliente, teléfono o producto..."
        class="w-72 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <div class="flex items-center gap-2 text-sm text-zinc-400">
        <span>Desde</span>
        <input
          v-model="filters.dateFrom"
          type="date"
          class="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <span>Hasta</span>
        <input
          v-model="filters.dateTo"
          type="date"
          class="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <p class="text-sm text-zinc-500">{{ filteredSales.length }} venta(s)</p>
      <p v-if="pendingSales.length > 0" class="text-sm text-warning">
        {{ pendingSales.length }} con saldo pendiente · {{ formatCurrency(pendingTotal) }} por cobrar
      </p>
    </div>

    <LoadingSpinner v-if="salesStore.loading" label="Cargando ventas..." />
    <SaleHistoryTable v-else :sales="filteredSales" @select="openSale" />

    <SaleDetailSidebar
      v-model="detailOpen"
      :sale="selectedSale"
      @edit="editOpen = true"
      @pay="payOpen = true"
    />
    <SaleEditModal v-model="editOpen" :sale="selectedSale" @saved="onSaleSaved" />
    <CreditPaymentModal v-model="payOpen" :sale="selectedSale" @saved="onSaleSaved" />
  </div>
</template>