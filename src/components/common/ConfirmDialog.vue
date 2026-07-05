<script setup lang="ts">
import AppModal from './AppModal.vue'

defineProps<{
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
}>()

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ confirm: [] }>()

function handleConfirm() {
  emit('confirm')
  open.value = false
}
</script>

<template>
  <AppModal v-model="open" :title="title" size="sm">
    <p class="text-sm text-zinc-300">{{ message }}</p>
    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm text-zinc-300 transition hover:bg-surface-overlay"
          @click="open = false"
        >
          {{ cancelLabel ?? 'Cancelar' }}
        </button>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-white transition"
          :class="
            variant === 'danger'
              ? 'bg-danger hover:bg-red-600'
              : 'bg-accent hover:bg-accent-hover'
          "
          @click="handleConfirm"
        >
          {{ confirmLabel ?? 'Confirmar' }}
        </button>
      </div>
    </template>
  </AppModal>
</template>