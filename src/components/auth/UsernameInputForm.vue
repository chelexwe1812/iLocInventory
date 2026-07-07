<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  isValidUsername,
  normalizeUsername,
  sanitizeUsernameInput,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_REQUIREMENTS_HINT,
} from '@/services/auth'

const username = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    submitLabel?: string
    disabled?: boolean
    busy?: boolean
    inputId?: string
  }>(),
  {
    label: 'Nombre de usuario',
    submitLabel: 'Continuar',
    inputId: 'username-input',
  },
)

const emit = defineEmits<{ submit: [username: string] }>()

const inputRef = ref<HTMLInputElement | null>(null)

const canSubmit = computed(
  () => isValidUsername(username.value) && !props.disabled && !props.busy,
)

const requirementsHint = computed(() => props.hint ?? USERNAME_REQUIREMENTS_HINT)

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
  const sanitized = sanitizeUsernameInput(el.value)
  username.value = sanitized
  el.value = sanitized
}

function handleSubmit(): void {
  if (!canSubmit.value) return
  emit('submit', normalizeUsername(username.value))
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label :for="inputId" class="mb-1.5 block text-sm text-zinc-400">{{ label }}</label>
      <input
        :id="inputId"
        ref="inputRef"
        :value="username"
        type="text"
        autocomplete="username"
        spellcheck="false"
        :maxlength="USERNAME_MAX_LENGTH"
        :disabled="disabled || busy"
        class="input-field max-w-sm"
        :placeholder="`Mínimo ${USERNAME_MIN_LENGTH} caracteres`"
        @input="onInput"
      />
      <p class="mt-2 text-xs text-zinc-500">{{ requirementsHint }}</p>
    </div>

    <button
      type="submit"
      class="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="!canSubmit"
    >
      {{ busy ? 'Guardando...' : submitLabel }}
    </button>
  </form>
</template>