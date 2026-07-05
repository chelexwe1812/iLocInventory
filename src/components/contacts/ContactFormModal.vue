<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Contact, ContactFormData } from '@/types'
import AppModal from '@/components/common/AppModal.vue'

const props = defineProps<{
  /** Contacto a editar; si es null/undefined el modal crea uno nuevo */
  contact?: Contact | null
}>()

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  save: [data: ContactFormData]
}>()

const name = ref('')
const phone = ref('')
const notes = ref('')

function resetForm() {
  name.value = props.contact?.name ?? ''
  phone.value = props.contact?.phone ?? ''
  notes.value = props.contact?.notes ?? ''
}

// Rellena el formulario cada vez que se abre (nuevo o edición).
watch(open, (isOpen) => {
  if (isOpen) resetForm()
})

function handleSave() {
  if (!name.value.trim()) return
  emit('save', {
    name: name.value.trim(),
    phone: phone.value.trim() || undefined,
    notes: notes.value.trim() || undefined,
  })
}
</script>

<template>
  <AppModal v-model="open" :title="contact ? 'Editar contacto' : 'Nuevo contacto'" size="sm">
    <div class="space-y-4">
      <div>
        <label class="mb-1 block text-sm text-zinc-400">Nombre *</label>
        <input
          v-model="name"
          class="input-field"
          placeholder="Nombre del contacto"
          autofocus
          @keyup.enter="handleSave"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm text-zinc-400">Teléfono</label>
        <input
          v-model="phone"
          type="tel"
          class="input-field"
          placeholder="Opcional"
          @keyup.enter="handleSave"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm text-zinc-400">Notas</label>
        <textarea
          v-model="notes"
          rows="3"
          class="input-field resize-none"
          placeholder="Preferencias, acuerdos de descuento, etc."
        />
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
          class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          :disabled="!name.trim()"
          @click="handleSave"
        >
          {{ contact ? 'Guardar cambios' : 'Crear contacto' }}
        </button>
      </div>
    </template>
  </AppModal>
</template>
