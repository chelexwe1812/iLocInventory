<script setup lang="ts">
import { computed } from 'vue'
import { useCurrency } from '@/composables/useCurrency'

const props = defineProps<{
  /** Monto en Bolivianos a convertir. */
  bs: number
  /** Tipo de cambio congelado del registro; si se omite, usa el actual. */
  rate?: number
}>()

const { showUsd, formatUsdEquivalent } = useCurrency()

const text = computed(() => `≈ ${formatUsdEquivalent(props.bs, props.rate)}`)
</script>

<template>
  <span v-if="showUsd" class="text-xs font-normal tabular-nums text-zinc-500">{{ text }}</span>
</template>
