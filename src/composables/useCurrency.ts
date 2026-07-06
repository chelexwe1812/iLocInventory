import { ref } from 'vue'
import { formatUsd } from '@/utils/format'

const RATE_KEY = 'iloc-exchange-rate'
const SHOW_USD_KEY = 'iloc-show-usd'

// Tipo de cambio por defecto: Bolivianos por 1 USD. Editable en Ajustes.
const DEFAULT_RATE = 6.96

function readStoredRate(): number {
  try {
    const raw = localStorage.getItem(RATE_KEY)
    if (raw !== null) {
      const parsed = Number.parseFloat(raw)
      if (Number.isFinite(parsed) && parsed > 0) return parsed
    }
  } catch {
    // localStorage no disponible
  }
  return DEFAULT_RATE
}

function readStoredShowUsd(): boolean {
  try {
    return localStorage.getItem(SHOW_USD_KEY) === 'true'
  } catch {
    // localStorage no disponible
    return false
  }
}

// Estado a nivel de módulo: un único origen de verdad compartido por toda la app.
const exchangeRate = ref<number>(readStoredRate())
const showUsd = ref<boolean>(readStoredShowUsd())

/**
 * Composable de moneda. La app almacena todos los montos en Bolivianos (Bs);
 * el dólar es solo un equivalente de visualización, calculado con un tipo de
 * cambio configurable. Para registros históricos (ventas, compras) se pasa el
 * tipo de cambio guardado en el registro para congelar su valor en USD.
 *
 * El estado es un singleton reactivo persistido en localStorage.
 */
export function useCurrency() {
  function setExchangeRate(next: number): void {
    if (!Number.isFinite(next) || next <= 0) return
    exchangeRate.value = next
    try {
      localStorage.setItem(RATE_KEY, String(next))
    } catch {
      // localStorage no disponible
    }
  }

  function setShowUsd(next: boolean): void {
    showUsd.value = next
    try {
      localStorage.setItem(SHOW_USD_KEY, String(next))
    } catch {
      // localStorage no disponible
    }
  }

  /** Convierte un monto en Bs a USD usando el tipo de cambio dado o el actual. */
  function toUsd(amountBs: number, rate?: number): number {
    const r = rate && rate > 0 ? rate : exchangeRate.value
    return amountBs / r
  }

  /** Devuelve el equivalente en USD ya formateado (p. ej. "$12.34"). */
  function formatUsdEquivalent(amountBs: number, rate?: number): string {
    return formatUsd(toUsd(amountBs, rate))
  }

  return {
    exchangeRate,
    showUsd,
    setExchangeRate,
    setShowUsd,
    toUsd,
    formatUsdEquivalent,
  }
}
