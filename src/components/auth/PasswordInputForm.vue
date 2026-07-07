<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  isValidPassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS_HINT,
  sanitizePasswordInput,
} from '@/services/auth'

const password = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    submitLabel?: string
    disabled?: boolean
    busy?: boolean
    inputId?: string
    /** Si es false (p. ej. al desbloquear), basta con que no esté vacía. */
    validateFormat?: boolean
  }>(),
  {
    label: 'Contraseña',
    submitLabel: 'Continuar',
    inputId: 'password-input',
    validateFormat: true,
  },
)

const emit = defineEmits<{ submit: [password: string] }>()

const inputRef = ref<HTMLInputElement | null>(null)

const canSubmit = computed(() => {
  const valueOk = props.validateFormat
    ? isValidPassword(password.value)
    : password.value.length > 0
  return valueOk && !props.disabled && !props.busy
})

const requirementsHint = computed(() => props.hint ?? PASSWORD_REQUIREMENTS_HINT)

function focusInput(): void {
  inputRef.value?.focus()
}

onMounted(() => {
  void nextTick(() => focusInput())
})

watch(
  () => props.busy,
  (next) => {
    if (!next) void nextTick(() => focusInput())
  },
)

function onInput(event: Event): void {
  const el = event.target as HTMLInputElement
  const next = props.validateFormat
    ? sanitizePasswordInput(el.value)
    : el.value.slice(0, PASSWORD_MAX_LENGTH)
  password.value = next
  el.value = next
}

function handleSubmit(): void {
  if (!canSubmit.value) return
  emit('submit', password.value)
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label :for="inputId" class="mb-1.5 block text-sm text-zinc-400">{{ label }}</label>
      <input
        :id="inputId"
        ref="inputRef"
        :value="password"
        type="password"
        autocomplete="off"
        spellcheck="false"
        :maxlength="PASSWORD_MAX_LENGTH"
        :disabled="disabled || busy"
        class="input-field max-w-sm font-mono"
        :placeholder="`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`"
        @input="onInput"
      />
      <p class="mt-2 text-xs text-zinc-500">{{ requirementsHint }}</p>
    </div>

    <button
      type="submit"
      class="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="!canSubmit"
    >
      {{ busy ? 'Verificando...' : submitLabel }}
    </button>
  </form>
</template>