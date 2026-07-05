<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
  label?: string
}>()

const sizeMap = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3">
    <div
      class="animate-spin rounded-full border-2 border-zinc-600 border-t-accent"
      :class="sizeMap[size ?? 'md']"
    />
    <p v-if="label" class="text-sm text-zinc-400">{{ label }}</p>
  </div>
</template>