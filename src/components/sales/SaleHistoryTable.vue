<script setup lang="ts">
import type { Sale } from '@/types'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import SalePdfButton from './SalePdfButton.vue'

defineProps<{
  sales: Sale[]
}>()

const emit = defineEmits<{
  select: [sale: Sale]
}>()

const paymentLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  canje: 'Equipo a cuenta',
  credito: 'Crédito',
  otro: 'Otro',
}

function pendingBalance(sale: Sale): number {
  if (sale.paymentMethod !== 'credito' || sale.creditPaid) return 0
  return sale.creditBalance ?? 0
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-border">
    <table class="w-full text-left text-sm">
      <thead class="border-b border-border bg-surface-overlay text-xs uppercase text-zinc-500">
        <tr>
          <th class="px-4 py-3 font-medium">Fecha</th>
          <th class="px-4 py-3 font-medium">Cliente</th>
          <th class="px-4 py-3 font-medium">Items</th>
          <th class="px-4 py-3 font-medium">Pago</th>
          <th class="px-4 py-3 font-medium text-right">Total</th>
          <th class="px-4 py-3 font-medium text-right">Acciones</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        <tr
          v-for="sale in sales"
          :key="sale.id"
          class="cursor-pointer transition hover:bg-surface-overlay/50"
          :class="{ 'bg-warning/5': pendingBalance(sale) > 0 }"
          @click="emit('select', sale)"
        >
          <td class="px-4 py-3 text-zinc-300">{{ formatDateTime(sale.date) }}</td>
          <td class="px-4 py-3">
            <p class="text-zinc-200">{{ sale.customerName ?? '—' }}</p>
            <p v-if="sale.customerPhone" class="text-xs text-zinc-500">{{ sale.customerPhone }}</p>
          </td>
          <td class="px-4 py-3 text-zinc-400">{{ sale.items.length }} producto(s)</td>
          <td class="px-4 py-3">
            <span
              class="rounded-md px-2 py-0.5 text-xs"
              :class="
                pendingBalance(sale) > 0
                  ? 'bg-warning/15 text-warning'
                  : 'bg-surface-overlay text-zinc-300'
              "
            >
              {{ paymentLabels[sale.paymentMethod] }}
            </span>
            <p v-if="pendingBalance(sale) > 0" class="mt-1 text-xs text-warning">
              Saldo {{ formatCurrency(pendingBalance(sale)) }}
              <template v-if="sale.creditDueDate"> · vence {{ formatDate(sale.creditDueDate) }}</template>
            </p>
          </td>
          <td class="px-4 py-3 text-right font-medium text-zinc-100">
            {{ formatCurrency(sale.total) }}
          </td>
          <td class="px-4 py-3 text-right" @click.stop>
            <SalePdfButton :sale="sale" compact />
          </td>
        </tr>
        <tr v-if="sales.length === 0">
          <td colspan="6" class="px-4 py-12 text-center text-zinc-500">
            No hay ventas registradas
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>