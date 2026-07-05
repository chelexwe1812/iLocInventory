<script setup lang="ts">
import { FileDown } from 'lucide-vue-next'
import type { Sale } from '@/types'
import { downloadSaleReceipt } from '@/services/pdf'

defineProps<{
  sale: Sale
  label?: string
  compact?: boolean
}>()
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1.5 rounded-lg text-sm transition"
    :class="
      compact
        ? 'p-1.5 text-zinc-400 hover:bg-surface-overlay hover:text-accent'
        : 'border border-border px-3 py-1.5 text-zinc-300 hover:border-accent hover:text-accent'
    "
    :title="'Descargar ticket PDF'"
    @click="downloadSaleReceipt(sale)"
  >
    <FileDown :size="compact ? 16 : 14" />
    <span v-if="!compact">{{ label ?? 'PDF' }}</span>
  </button>
</template>