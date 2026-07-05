<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { MoreVertical, PackageMinus, Pencil, Trash2 } from 'lucide-vue-next'
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  toggle: []
  edit: []
  delete: []
  adjustStock: []
}>()

const menuRef = ref<HTMLElement | null>(null)

function onClickOutside(event: MouseEvent) {
  if (!props.open || !menuRef.value) return
  if (!menuRef.value.contains(event.target as Node)) {
    emit('toggle')
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))

function run(action: 'adjustStock' | 'edit' | 'delete') {
  if (action === 'adjustStock') emit('adjustStock')
  else if (action === 'edit') emit('edit')
  else emit('delete')
  emit('toggle')
}
</script>

<template>
  <div ref="menuRef" class="relative">
    <button
      type="button"
      class="rounded-lg p-1.5 text-zinc-500 transition hover:bg-surface-overlay hover:text-zinc-200"
      :class="{ 'bg-surface-overlay text-zinc-200': open }"
      title="Acciones"
      @click.stop="emit('toggle')"
    >
      <MoreVertical :size="16" />
    </button>

    <div
      v-if="open"
      class="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-surface-raised py-1 shadow-xl"
    >
      <button
        type="button"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-surface-overlay hover:text-zinc-100"
        @click="run('adjustStock')"
      >
        <PackageMinus :size="15" class="text-zinc-400" />
        Ajustar stock
      </button>
      <button
        type="button"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-surface-overlay hover:text-accent"
        @click="run('edit')"
      >
        <Pencil :size="15" class="text-zinc-400" />
        Editar
      </button>
      <div class="my-1 border-t border-border" />
      <button
        type="button"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-danger transition hover:bg-danger/10"
        @click="run('delete')"
      >
        <Trash2 :size="15" />
        Eliminar
      </button>
    </div>
  </div>
</template>