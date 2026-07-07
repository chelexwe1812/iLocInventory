<script setup lang="ts">
import { computed, ref } from 'vue'
import { Lock, User } from 'lucide-vue-next'
import PasswordInputForm from '@/components/auth/PasswordInputForm.vue'
import UsernameInputForm from '@/components/auth/UsernameInputForm.vue'
import { useAuth } from '@/composables/useAuth'
import { PASSWORD_REQUIREMENTS_HINT } from '@/services/auth'

type Mode = 'username' | 'setup' | 'confirm' | 'unlock'

const { configured, username, unlock, setup, lockoutRemainingMs } = useAuth()

const mode = ref<Mode>(configured.value ? 'unlock' : 'username')
const usernameDraft = ref('')
const password = ref('')
const pendingPassword = ref('')
const error = ref<string | null>(null)
const busy = ref(false)

const displayUsername = computed(() => username.value?.trim() || null)

const title = computed(() => {
  if (mode.value === 'username') return 'Configura tu cuenta'
  if (mode.value === 'setup') return 'Crea tu contraseña'
  if (mode.value === 'confirm') return 'Confirma tu contraseña'
  return displayUsername.value ? `Hola, ${displayUsername.value}` : 'Desbloquear iLoc'
})

const subtitle = computed(() => {
  if (mode.value === 'username') {
    return 'Elige un nombre de usuario para identificar la sesión en este equipo.'
  }
  if (mode.value === 'setup') {
    return `Define una contraseña para proteger la aplicación. ${PASSWORD_REQUIREMENTS_HINT}`
  }
  if (mode.value === 'confirm') return 'Vuelve a escribir la misma contraseña para confirmarla.'
  return 'Escribe tu contraseña para acceder al inventario.'
})

const submitLabel = computed(() => {
  if (mode.value === 'unlock') return 'Iniciar sesión'
  if (mode.value === 'confirm') return 'Activar cuenta'
  return 'Continuar'
})

const lockoutSeconds = computed(() => Math.ceil(lockoutRemainingMs.value / 1000))
const lockedOut = computed(() => lockoutRemainingMs.value > 0)

function clearError(): void {
  error.value = null
}

function resetPassword(): void {
  password.value = ''
}

async function submitUsername(value: string): Promise<void> {
  if (busy.value) return
  clearError()
  usernameDraft.value = value
  mode.value = 'setup'
}

async function submitPassword(value: string): Promise<void> {
  if (lockedOut.value || busy.value) return
  busy.value = true
  clearError()

  try {
    if (mode.value === 'setup') {
      pendingPassword.value = value
      mode.value = 'confirm'
      resetPassword()
      return
    }

    if (mode.value === 'confirm') {
      if (value !== pendingPassword.value) {
        error.value = 'Las contraseñas no coinciden. Intenta de nuevo.'
        mode.value = 'setup'
        pendingPassword.value = ''
        resetPassword()
        return
      }
      await setup(usernameDraft.value, value)
      resetPassword()
      return
    }

    const result = await unlock(value)
    if (result === 'ok') {
      resetPassword()
      return
    }
    if (result === 'lockout') {
      error.value = `Demasiados intentos. Espera ${lockoutSeconds.value}s.`
      resetPassword()
      return
    }
    error.value = 'Contraseña incorrecta.'
    resetPassword()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo verificar la contraseña.'
    resetPassword()
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface p-6">
    <div class="w-full max-w-md rounded-xl border border-border bg-surface-raised p-8 shadow-lg">
      <div class="mb-6 flex items-start gap-4">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-overlay"
        >
          <User v-if="mode === 'username'" :size="20" class="text-accent" />
          <Lock v-else :size="20" class="text-accent" />
        </div>
        <div>
          <h1 class="text-lg font-semibold text-zinc-100">{{ title }}</h1>
          <p class="mt-1 text-sm text-zinc-500">{{ subtitle }}</p>
        </div>
      </div>

      <p
        v-if="error"
        class="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
        role="alert"
        aria-live="polite"
      >
        {{ error }}
      </p>
      <p
        v-else-if="lockedOut"
        class="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
      >
        Demasiados intentos. Espera {{ lockoutSeconds }} segundos antes de volver a intentar.
      </p>

      <UsernameInputForm
        v-if="mode === 'username'"
        v-model="usernameDraft"
        :busy="busy"
        input-id="setup-username"
        @submit="submitUsername"
      />

      <PasswordInputForm
        v-else
        v-model="password"
        :label="mode === 'unlock' ? 'Contraseña' : 'Contraseña'"
        :hint="mode === 'unlock' ? 'Pulsa Enter para iniciar sesión.' : undefined"
        :validate-format="mode !== 'unlock'"
        :submit-label="submitLabel"
        :disabled="lockedOut"
        :busy="busy"
        input-id="lock-password"
        @submit="submitPassword"
      />
    </div>
  </div>
</template>