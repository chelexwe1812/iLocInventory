import { ref } from 'vue'

const NAME_KEY = 'iloc-store-name'
const DESCRIPTION_KEY = 'iloc-store-description'
const PHONE_KEY = 'iloc-store-phone'
const ADDRESS_KEY = 'iloc-store-address'

// Valores por defecto: coinciden con los textos que antes estaban hardcodeados
// en el sidebar y los PDFs, para que nada cambie hasta que el usuario los edite.
const DEFAULT_NAME = 'iLoc Inventory'
const DEFAULT_DESCRIPTION = 'Celulares y Accesorios'
const DEFAULT_PHONE = ''
const DEFAULT_ADDRESS = ''

function readStored(key: string, fallback: string): string {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) return raw
  } catch {
    // localStorage no disponible
  }
  return fallback
}

// Estado a nivel de módulo: un único origen de verdad compartido por toda la app.
const name = ref<string>(readStored(NAME_KEY, DEFAULT_NAME))
const description = ref<string>(readStored(DESCRIPTION_KEY, DEFAULT_DESCRIPTION))
const phone = ref<string>(readStored(PHONE_KEY, DEFAULT_PHONE))
const address = ref<string>(readStored(ADDRESS_KEY, DEFAULT_ADDRESS))

function persist(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // localStorage no disponible
  }
}

/**
 * Composable de datos de la tienda. El nombre y la descripción se muestran en
 * la parte superior izquierda (sidebar) y, junto con el teléfono y la dirección,
 * se imprimen en el encabezado de los tickets de venta, notas de devolución y
 * órdenes de compra.
 *
 * El estado es un singleton reactivo persistido en localStorage, siguiendo el
 * mismo patrón que useCurrency.
 */
export function useStoreInfo() {
  function setName(next: string): void {
    name.value = next
    persist(NAME_KEY, next)
  }

  function setDescription(next: string): void {
    description.value = next
    persist(DESCRIPTION_KEY, next)
  }

  function setPhone(next: string): void {
    phone.value = next
    persist(PHONE_KEY, next)
  }

  function setAddress(next: string): void {
    address.value = next
    persist(ADDRESS_KEY, next)
  }

  /** Nombre efectivo para encabezados: usa el default si el usuario lo dejó vacío. */
  function displayName(): string {
    return name.value.trim() || DEFAULT_NAME
  }

  return {
    name,
    description,
    phone,
    address,
    setName,
    setDescription,
    setPhone,
    setAddress,
    displayName,
  }
}
