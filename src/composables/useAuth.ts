import { ref } from 'vue'
import {
  changePin,
  changeUsername,
  getLockoutRemainingMs,
  getUsername,
  loadAuthState,
  lockApp,
  setupAuth,
  unlockWithPin,
} from '@/services/auth'
import { isPinConfigured, isUnlocked } from '@/services/authSession'

const ready = ref(false)
const configured = ref(false)
const unlocked = ref(false)
const username = ref<string | null>(null)
const lockoutRemainingMs = ref(0)

let tickTimer: ReturnType<typeof setInterval> | null = null

function syncState(): void {
  configured.value = isPinConfigured()
  unlocked.value = isUnlocked()
  username.value = getUsername()
  lockoutRemainingMs.value = getLockoutRemainingMs()
}

function startLockoutTicker(): void {
  if (tickTimer) return
  tickTimer = setInterval(() => {
    lockoutRemainingMs.value = getLockoutRemainingMs()
    if (lockoutRemainingMs.value <= 0 && tickTimer) {
      clearInterval(tickTimer)
      tickTimer = null
    }
  }, 500)
}

export function useAuth() {
  async function init(): Promise<void> {
    await loadAuthState()
    ready.value = true
    syncState()
    if (lockoutRemainingMs.value > 0) startLockoutTicker()
  }

  async function setup(name: string, password: string): Promise<void> {
    await setupAuth(name, password)
    syncState()
  }

  async function unlock(password: string): Promise<'ok' | 'invalid' | 'lockout'> {
    const result = await unlockWithPin(password)
    syncState()
    if (result === 'lockout') startLockoutTicker()
    return result
  }

  async function updatePin(
    currentPassword: string,
    newPassword: string,
  ): Promise<'ok' | 'invalid'> {
    const result = await changePin(currentPassword, newPassword)
    syncState()
    return result
  }

  async function updateUsername(next: string): Promise<void> {
    await changeUsername(next)
    syncState()
  }

  function logout(): void {
    lockApp()
    syncState()
  }

  /** @deprecated Usa logout */
  function lock(): void {
    logout()
  }

  return {
    ready,
    configured,
    unlocked,
    username,
    lockoutRemainingMs,
    init,
    setup,
    unlock,
    updatePin,
    updateUsername,
    logout,
    lock,
  }
}