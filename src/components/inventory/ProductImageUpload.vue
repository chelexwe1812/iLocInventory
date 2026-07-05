<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { ImagePlus, X } from 'lucide-vue-next'
import type { ProductCategory } from '@/types'
import { saveFile, getFileUrl, deleteFile } from '@/services/storage'
import CategoryIcon from './CategoryIcon.vue'

const props = defineProps<{
  category: ProductCategory
  imagePath?: string
}>()

const emit = defineEmits<{
  'update:imagePath': [path: string | undefined]
}>()

const previewUrl = ref<string | null>(null)
const uploading = ref(false)

async function loadPreview(path: string) {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = await getFileUrl(path)
}

watch(
  () => props.imagePath,
  async (path) => {
    if (path) await loadPreview(path)
    else previewUrl.value = null
  },
  { immediate: true },
)

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

async function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) return

  uploading.value = true
  try {
    if (props.imagePath) await deleteFile(props.imagePath)
    const path = await saveFile(file)
    emit('update:imagePath', path)
    await loadPreview(path)
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function removeImage() {
  if (props.imagePath) await deleteFile(props.imagePath)
  emit('update:imagePath', undefined)
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}
</script>

<template>
  <div class="space-y-2">
    <label class="text-sm text-zinc-400">Imagen</label>
    <div
      v-if="previewUrl"
      class="relative inline-block overflow-hidden rounded-lg border border-border"
    >
      <img :src="previewUrl" alt="Vista previa" class="h-32 w-32 object-cover" />
      <button
        type="button"
        class="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
        @click="removeImage"
      >
        <X :size="14" />
      </button>
    </div>
    <label
      v-else
      class="group flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-surface-overlay/40 transition hover:border-accent/50"
      :class="{ 'pointer-events-none opacity-50': uploading }"
    >
      <CategoryIcon :category="category" :size="36" />
      <span class="flex items-center gap-1 text-[10px] text-zinc-500 group-hover:text-accent">
        <ImagePlus :size="12" />
        {{ uploading ? 'Subiendo...' : 'Subir foto' }}
      </span>
      <input type="file" accept="image/*" class="hidden" @change="onFileSelect" />
    </label>
  </div>
</template>