export const AUTH_META_KEY = 'auth_pin'
const SESSION_KEY = 'iloc-unlocked'

export class AuthError extends Error {
  constructor(message = 'La aplicación está bloqueada') {
    super(message)
    this.name = 'AuthError'
  }
}

let pinConfigured = false
let unlocked = false

function readSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function writeSession(active: boolean): void {
  try {
    if (active) sessionStorage.setItem(SESSION_KEY, '1')
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // sessionStorage no disponible
  }
}

export function isPinConfigured(): boolean {
  return pinConfigured
}

export function isUnlocked(): boolean {
  return unlocked
}

export function setPinConfigured(next: boolean): void {
  pinConfigured = next
}

export function setUnlockedState(next: boolean): void {
  unlocked = next
  writeSession(next)
}

export function restoreSessionFromStorage(): void {
  unlocked = pinConfigured && readSession()
}

/** Bloquea escrituras cuando hay PIN configurado y la sesión no está desbloqueada. */
export function assertUnlocked(): void {
  if (pinConfigured && !unlocked) throw new AuthError()
}

export function lockApp(): void {
  if (!pinConfigured) return
  setUnlockedState(false)
}