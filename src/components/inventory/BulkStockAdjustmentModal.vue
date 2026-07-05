<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Product } from '@/types'
import AppModal from '@/components/common/AppModal.vue'
import QuantityStepper from '@/components/common/QuantityStepper.vue'

const props = defineProps<{
  products: Product[]
}>()

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  apply: [mode: 'set' | 'delta', quantity: number, reason: string, notes?: string]
}>()

type AdjustMode = 'set' | 'delta'
type DeltaDirection = 'add' | 'remove'

const mode = ref<AdjustMode>('delta')
const direction = ref<DeltaDirection>('add')
const quantity = ref(1)
const reason = ref('Ajuste manual')
const notes = ref('')

watch(open, (isOpen) => {
  if (isOpen) {
    mode.value = 'delta'
    direction.value = 'add'
    quantity.value = 1
    reason.value = 'Ajuste manual'
    notes.value = ''
  }
})

function submit() {
  const amount =
    mode.value === 'delta' && direction.value === 'remove' ? -quantity.value : quantity.value
  emit('apply', mode.value, amount, reason.value, notes.value || undefined)
}
</script>

<template>
  <AppModal
    v-model="open"
    :title="`Ajustar stock (${products.length} productos)`"
    size="sm"
  >
    <div class="space-y-5">
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-lg border px-3 py-2 text-sm transition"
          :class="
            mode === 'delta'
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border text-zinc-400 hover:border-zinc-600'
          "
          @click="mode = 'delta'"
        >
          Agregar / quitar
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg border px-3 py-2 text-sm transition"
          :class="
            mode === 'set'
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border text-zinc-400 hover:border-zinc-600'
          "
          @click="mode = 'set'"
        >
          Establecer cantidad
        </button>
      </div>

      <div v-if="mode === 'delta'" class="flex justify-center gap-2">
        <button
          type="button"
          class="rounded-lg border px-4 py-2 text-sm transition"
          :class="
            direction === 'add'
              ? 'border-success bg-success/10 text-success'
              : 'border-border text-zinc-400 hover:border-zinc-600'
          "
          @click="direction = 'add'"
        >
          + Agregar
        </button>
        <button
          type="button"
          class="rounded-lg border px-4 py-2 text-sm transition"
          :class="
            direction === 'remove'
              ? 'border-danger bg-danger/10 text-danger'
              : 'border-border text-zinc-400 hover:border-zinc-600'
          "
          @click="direction = 'remove'"
        >
          − Quitar
        </button>
      </div>

      <div class="space-y-2">
        <label class="block text-center text-sm text-zinc-400">
          {{ mode === 'delta' ? 'Cantidad' : 'Stock para todos' }}
        </label>
        <QuantityStepper v-model="quantity" size="lg" :min="mode === 'set' ? 0 : 1" />
      </div>

      <ul class="max-h-32 space-y-1 overflow-y-auto rounded-lg bg-surface-overlay p-3 text-xs text-zinc-400">
        <li v-for="p in products" :key="p.id">
          {{ p.brand }} {{ p.model }}
          <span class="text-zinc-500">· stock {{ p.stock }}</span>
        </li>
      </ul>

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
          Aplicar a {{ products.length }} productos
        </button>
      </div>
    </template>
  </AppModal>
</template>