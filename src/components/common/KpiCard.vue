<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string | number
  icon: Component
  trend?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}>()

const variantClasses = {
  default: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}
</script>

<template>
  <div class="rounded-xl border border-border bg-surface-raised p-5">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-zinc-400">{{ label }}</p>
        <p class="mt-1 text-2xl font-semibold text-zinc-100">{{ value }}</p>
        <p v-if="trend" class="mt-1 text-xs text-zinc-500">{{ trend }}</p>
      </div>
      <div
        class="rounded-lg bg-surface-overlay p-2.5"
        :class="variantClasses[variant ?? 'default']"
      >
        <component :is="icon" :size="20" />
      </div>
    </div>
  </div>
</template>