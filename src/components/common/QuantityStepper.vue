<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'

const value = defineModel<number>({ required: true })

const props = withDefaults(
  defineProps<{
    min?: number
    max?: number
    step?: number
    size?: 'md' | 'lg'
    disabled?: boolean
  }>(),
  { min: 0, step: 1, size: 'lg', disabled: false },
)

const btnClass =
  'flex shrink-0 items-center justify-center rounded-lg border-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-40'

const sizeClasses = {
  md: { btn: 'h-9 w-9', icon: 16, input: 'h-9 w-14 text-lg' },
  lg: { btn: 'h-11 w-11', icon: 20, input: 'h-11 w-[4.5rem] text-2xl' },
}

function decrement() {
  if (props.disabled) return
  value.value = Math.max(props.min, value.value - props.step)
}

function increment() {
  if (props.disabled) return
  if (props.max !== undefined) {
    value.value = Math.min(props.max, value.value + props.step)
  } else {
    value.value += props.step
  }
}

function onInput(event: Event) {
  const raw = Number((event.target as HTMLInputElement).value)
  if (Number.isNaN(raw)) return
  let next = raw
  if (props.max !== undefined) next = Math.min(props.max, next)
  next = Math.max(props.min, next)
  value.value = next
}
</script>

<template>
  <div class="flex items-center justify-center gap-2.5">
    <button
      type="button"
      :disabled="disabled || value <= min"
      :class="[btnClass, sizeClasses[size].btn, 'border-border bg-surface-overlay text-zinc-200 hover:border-accent hover:bg-accent/10 hover:text-accent active:scale-95']"
      aria-label="Disminuir"
      @click="decrement"
    >
      <Minus :size="sizeClasses[size].icon" />
    </button>

    <input
      :value="value"
      type="number"
      :min="min"
      :max="max"
      :disabled="disabled"
      class="quantity-stepper-input"
      :class="[
        sizeClasses[size].input,
        'rounded-lg border-2 border-border bg-surface-raised text-center font-semibold text-zinc-100 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50',
      ]"
      @input="onInput"
    />

    <button
      type="button"
      :disabled="disabled || (max !== undefined && value >= max)"
      :class="[btnClass, sizeClasses[size].btn, 'border-accent/40 bg-accent/10 text-accent hover:border-accent hover:bg-accent/20 active:scale-95']"
      aria-label="Aumentar"
      @click="increment"
    >
      <Plus :size="sizeClasses[size].icon" />
    </button>
  </div>
</template>

<style scoped>
.quantity-stepper-input {
  -moz-appearance: textfield;
  appearance: textfield;
}

.quantity-stepper-input::-webkit-outer-spin-button,
.quantity-stepper-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>