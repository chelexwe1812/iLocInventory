<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Product } from '@/types'
import AppModal from '@/components/common/AppModal.vue'
import QuantityStepper from '@/components/common/QuantityStepper.vue'
import { formatCurrency } from '@/utils/format'

const props = defineProps<{
  product: Product | null
}>()

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  adjust: [newStock: number, reason: string, notes?: string]
}>()

const newStock = ref(0)
const reason = ref('Ajuste manual')
const notes = ref('')

watch(
  () => [open.value, props.product] as const,
  ([isOpen, product]) => {
    if (isOpen && product) {
      newStock.value = product.stock
      reason.value = 'Ajuste manual'
      notes.value = ''
    }
  },
)

const diff = computed(() => {
  if (!props.product) return 0
  return newStock.value - props.product.stock
})

function submit() {
  emit('adjust', newStock.value, reason.value, notes.value || undefined)
}
</script>

<template>
  <AppModal v-model="open" title="Ajustar stock" size="sm">
    <div v-if="product" class="space-y-5">
      <div class="rounded-lg bg-surface-overlay p-3">
        <p class="font-medium text-zinc-100">
          {{ product.brand }} {{ product.model }}
        </p>
        <p v-if="product.variant" class="text-sm text-zinc-400">{{ product.variant }}</p>
        <p class="mt-1 text-sm text-zinc-500">
          Stock actual: <span class="font-medium text-zinc-200">{{ product.stock }}</span>
          · Precio: {{ formatCurrency(product.price) }}
        </p>
      </div>

      <div class="space-y-2">
        <label class="block text-center text-sm text-zinc-400">Nuevo stock</label>
        <QuantityStepper v-model="newStock" size="lg" />
        <p
          v-if="diff !== 0"
          class="text-center text-sm font-medium"
          :class="diff > 0 ? 'text-success' : 'text-danger'"
        >
          {{ diff > 0 ? '+' : '' }}{{ diff }} unidades
        </p>
      </div>

      <div>
        <label class="mb-1 block text-sm text-zinc-400">Motivo</label>
        <select v-model="reason" class="input-field">
          <option value="Ajuste manual">Ajuste manual</option>
          <option value="Entrada de mercancía">Entrada de mercancía</option>
          <option value="Devolución">Devolución</option>
          <option value="Merma / Daño">Merma / Daño</option>
          <option value="Inventario físico">Inventario físico</option>
        </select>
      </div>

      <div>
        <label class="mb-1 block text-sm text-zinc-400">Notas</label>
        <textarea v-model="notes" rows="2" class="input-field resize-none" />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-surface-overlay"
          @click="open = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          @click="submit"
        >
          Aplicar ajuste
        </button>
      </div>
    </template>
  </AppModal>
</template>