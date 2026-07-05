<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { SaleFilters } from '@/types'
import SaleHistoryTable from '@/components/sales/SaleHistoryTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useSalesStore } from '@/stores/sales'
import { format, subDays } from 'date-fns'

const salesStore = useSalesStore()

const filters = ref<SaleFilters>({
  search: '',
  dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  dateTo: format(new Date(), 'yyyy-MM-dd'),
})

const filteredSales = computed(() => salesStore.filterSales(filters.value))

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

    <p class="text-sm text-zinc-500">{{ filteredSales.length }} venta(s)</p>

    <LoadingSpinner v-if="salesStore.loading" label="Cargando ventas..." />
    <SaleHistoryTable v-else :sales="filteredSales" />
  </div>
</template>