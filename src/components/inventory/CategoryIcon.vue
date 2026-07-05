<script setup lang="ts">
import type { ProductCategory } from '@/types'
import { getCategoryIcon, getCategoryIconClass } from '@/utils/category'

withDefaults(
  defineProps<{
    category: ProductCategory
    size?: number
  }>(),
  { size: 20 },
)
</script>

<template>
  <component
    :is="getCategoryIcon(category)"
    :size="size"
    :class="getCategoryIconClass(category)"
    class="shrink-0"
  />
</template>