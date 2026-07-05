<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PurchaseOrder } from '@/types'
import AppModal from '@/components/common/AppModal.vue'
import { CONDITION_LABELS } from '@/utils/product'

const props = defineProps<{ order: PurchaseOrder | null }>()
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ receive: [receipts: Record<number, number>] }>()

/** Cantidad a recibir por índice de línea */
const quantities = ref<Record<number, number>>({})

function remaining(index: number): number {
  const item = props.order?.items[index]
  if (!item) return 0
  return item.quantity - item.receivedQuantity
}

function itemName(index: number): string {
  const item = props.order?.items[index]
  if (!item) return ''
  return [item.brand, item.model, item.variant].filter(Boolean).join(' ')
}

/** Índices de líneas con cantidad pendiente por recibir */
const pendingIndexes = computed(() => {
  if (!props.order) return []
  return props.order.items.map((_, idx) => idx).filter((idx) => remaining(idx) > 0)
})

function fillAll() {
  const next: Record<number, number> = {}
  for (const idx of pendingIndexes.value) next[idx] = remaining(idx)
  quantities.value = next
}

watch(
  open,
  (isOpen) => {
    if (isOpen) fillAll()
  },
)

function clampInput(index: number) {
  const max = remaining(index)
  const val = Math.floor(Number(quantities.value[index]) || 0)
  quantities.value[index] = Math.max(0, Math.min(val, max))
}

const totalToReceive = computed(() =>
  pendingIndexes.value.reduce((sum, idx) => sum + (Number(quantities.value[idx]) || 0), 0),
)

function submit() {
  if (totalToReceive.value <= 0) return
  emit('receive', { ...quantities.value })
  open.value = false
}
</script>

<template>
  <AppModal v-model="open" :title="order ? `Recibir ${order.code}` : 'Recibir mercancía'" size="lg">
    <div v-if="order" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm text-zinc-400">
          Indica cuánto recibes de cada modelo. El stock se actualizará al confirmar.
        </p>
        <button
          type="button"
          class="rounded-lg border border-border px-3 py-1.5 text-xs text-zinc-300 transition hover:border-accent hover:text-accent"
          @click="fillAll"
        >
          Recibir todo
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="idx in pendingIndexes"
          :key="idx"
          class="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-raised p-3"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-zinc-100">{{ itemName(idx) }}</p>
            <p class="mt-0.5 text-xs text-zinc-500">
              <span
                class="mr-2 rounded px-1.5 py-0.5 font-medium"
                :class="
                  order.items[idx]!.condition === 'nuevo'
                    ? 'bg-accent/15 text-accent'
                    : 'bg-warning/15 text-warning'
                "
              >
                {{ CONDITION_LABELS[order.items[idx]!.condition] }}
              </span>
              Pedido: {{ order.items[idx]!.quantity }} · Recibido:
              {{ order.items[idx]!.receivedQuantity }} · Pendiente: {{ remaining(idx) }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <input
              v-model.number="quantities[idx]"
              type="number"
              min="0"
              :max="remaining(idx)"
              class="no-spinner w-20 rounded-lg border border-border bg-surface-overlay px-3 py-2 text-center text-sm focus:border-accent focus:outline-none"
              @input="clampInput(idx)"
            />
            <span class="text-xs text-zinc-500">/ {{ remaining(idx) }}</span>
          </div>
        </div>
      </div>

      <p v-if="pendingIndexes.length === 0" class="py-6 text-center text-sm text-zinc-500">
        No hay cantidades pendientes por recibir.
      </p>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-zinc-400">
          A recibir: <span class="font-semibold text-zinc-100">{{ totalToReceive }}</span> unidad(es)
        </p>
        <div class="flex gap-3">
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-surface-overlay"
            @click="open = false"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
            :disabled="totalToReceive <= 0"
            @click="submit"
          >
            Registrar recepción
          </button>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.no-spinner {
  -moz-appearance: textfield;
  appearance: textfield;
}
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
