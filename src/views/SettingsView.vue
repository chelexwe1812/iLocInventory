<script setup lang="ts">
import { ref } from 'vue'
import { Download, Upload, Database, RefreshCw, Palette, Sun, Moon, Monitor, DollarSign } from 'lucide-vue-next'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useStorage } from '@/composables/useStorage'
import { useTheme, type ThemePreference } from '@/composables/useTheme'
import { useCurrency } from '@/composables/useCurrency'
import { useProductsStore } from '@/stores/products'
import { useSalesStore } from '@/stores/sales'
import { useAppStore } from '@/stores/app'
import type { ExportData } from '@/services/storage'

const { backend, exportData, importData, resetData } = useStorage()
const { preference, setTheme } = useTheme()
const { exchangeRate, showUsd, setExchangeRate, setShowUsd } = useCurrency()

// Borrador editable del tipo de cambio; se confirma al salir del input.
const rateDraft = ref(String(exchangeRate.value))

function commitRate() {
  const parsed = Number.parseFloat(rateDraft.value)
  if (Number.isFinite(parsed) && parsed > 0) {
    setExchangeRate(parsed)
    rateDraft.value = String(parsed)
  } else {
    rateDraft.value = String(exchangeRate.value)
  }
}
const productsStore = useProductsStore()
const salesStore = useSalesStore()
const appStore = useAppStore()

const themeOptions: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

const showResetConfirm = ref(false)
const importing = ref(false)

async function handleExportJson() {
  try {
    const data = await exportData()
    data.settings = { exchangeRate: exchangeRate.value, showUsd: showUsd.value }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iloc-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    appStore.showToast('Respaldo JSON descargado', 'success')
  } catch {
    appStore.showToast('Error al exportar datos', 'error')
  }
}

async function handleExportCsv() {
  try {
    await productsStore.loadProducts()
    const headers = ['sku', 'brand', 'model', 'variant', 'category', 'condition', 'price', 'cost', 'stock', 'minStock']
    const rows = productsStore.products.map((p) =>
      headers.map((h) => {
        const val = p[h as keyof typeof p]
        return val !== undefined ? String(val) : ''
      }),
    )
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iloc-productos-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    appStore.showToast('CSV de productos descargado', 'success')
  } catch {
    appStore.showToast('Error al exportar CSV', 'error')
  }
}

async function handleImportJson(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  importing.value = true
  try {
    const text = await file.text()
    const data = JSON.parse(text) as ExportData
    if (!data.version || !data.products) throw new Error('Formato inválido')
    await importData(data, true)
    if (data.settings) {
      if (typeof data.settings.exchangeRate === 'number') setExchangeRate(data.settings.exchangeRate)
      if (typeof data.settings.showUsd === 'boolean') setShowUsd(data.settings.showUsd)
      rateDraft.value = String(exchangeRate.value)
    }
    await Promise.all([
      productsStore.loadProducts(),
      salesStore.loadSales(),
    ])
    appStore.showToast('Datos importados correctamente', 'success')
  } catch (e) {
    appStore.showToast(e instanceof Error ? e.message : 'Error al importar', 'error')
  } finally {
    importing.value = false
    input.value = ''
  }
}

async function handleReset() {
  try {
    await resetData()
    await Promise.all([
      productsStore.loadProducts(),
      salesStore.loadSales(),
    ])
    appStore.showToast('Datos restablecidos con datos de prueba', 'success')
  } catch {
    appStore.showToast('Error al restablecer', 'error')
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-8">
    <section class="rounded-xl border border-border bg-surface-raised p-6">
      <div class="mb-4 flex items-center gap-3">
        <Palette :size="20" class="text-accent" />
        <h2 class="text-sm font-medium text-zinc-300">Apariencia</h2>
      </div>
      <p class="mb-4 text-sm text-zinc-500">Elige el tema de la interfaz.</p>
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          type="button"
          class="flex flex-col items-center gap-2 rounded-lg border px-4 py-4 text-sm transition"
          :class="
            preference === option.value
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border text-zinc-400 hover:bg-surface-overlay hover:text-zinc-200'
          "
          :aria-pressed="preference === option.value"
          @click="setTheme(option.value)"
        >
          <component :is="option.icon" :size="20" />
          <span class="font-medium">{{ option.label }}</span>
        </button>
      </div>
    </section>

    <section class="rounded-xl border border-border bg-surface-raised p-6">
      <div class="mb-4 flex items-center gap-3">
        <DollarSign :size="20" class="text-accent" />
        <h2 class="text-sm font-medium text-zinc-300">Moneda</h2>
      </div>
      <p class="mb-4 text-sm text-zinc-500">
        Todos los montos se registran en Bolivianos (Bs). Opcionalmente puedes mostrar su
        equivalente en dólares usando un tipo de cambio configurable.
      </p>

      <div class="space-y-4">
        <div>
          <label for="exchange-rate" class="mb-1.5 block text-sm text-zinc-400">
            Tipo de cambio actual
          </label>
          <div class="flex items-center gap-2">
            <span class="text-sm text-zinc-500">1 USD =</span>
            <input
              id="exchange-rate"
              v-model="rateDraft"
              type="number"
              step="0.01"
              min="0"
              inputmode="decimal"
              class="w-28 rounded-lg border border-border bg-surface-overlay px-3 py-2 text-sm text-zinc-200 outline-none focus:border-accent"
              @blur="commitRate"
              @keydown.enter="commitRate"
            />
            <span class="text-sm text-zinc-500">Bs</span>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-zinc-300">Mostrar equivalente en USD</p>
            <p class="text-xs text-zinc-500">Añade el monto en dólares junto a los precios en Bs.</p>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="showUsd"
            class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition"
            :class="showUsd ? 'bg-accent' : 'bg-surface-overlay border border-border'"
            @click="setShowUsd(!showUsd)"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition"
              :class="showUsd ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-border bg-surface-raised p-6">
      <div class="mb-4 flex items-center gap-3">
        <Database :size="20" class="text-accent" />
        <h2 class="text-sm font-medium text-zinc-300">Almacenamiento local</h2>
      </div>
      <dl class="space-y-2 text-sm">
        <div class="flex justify-between">
          <dt class="text-zinc-500">Base de datos</dt>
          <dd class="text-zinc-200">Dexie.js (IndexedDB)</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-zinc-500">Archivos (fotos)</dt>
          <dd class="text-zinc-200">
            {{ backend === 'opfs' ? 'OPFS (Origin Private File System)' : 'Dexie fallback' }}
          </dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-zinc-500">Modo</dt>
          <dd class="text-success">100% offline</dd>
        </div>
      </dl>
    </section>

    <section class="rounded-xl border border-border bg-surface-raised p-6">
      <h2 class="mb-4 text-sm font-medium text-zinc-300">Respaldo y restauración</h2>
      <div class="space-y-3">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-surface-overlay"
          @click="handleExportJson"
        >
          <Download :size="18" class="text-accent" />
          <div>
            <p class="font-medium text-zinc-200">Exportar todo (JSON)</p>
            <p class="text-xs text-zinc-500">
              Productos, ventas, movimientos, contactos y compras
            </p>
          </div>
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-surface-overlay"
          @click="handleExportCsv"
        >
          <Download :size="18" class="text-accent" />
          <div>
            <p class="font-medium text-zinc-200">Exportar productos (CSV)</p>
            <p class="text-xs text-zinc-500">Solo inventario de productos</p>
          </div>
        </button>

        <label
          class="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-surface-overlay"
          :class="{ 'pointer-events-none opacity-50': importing }"
        >
          <Upload :size="18" class="text-accent" />
          <div>
            <p class="font-medium text-zinc-200">
              {{ importing ? 'Importando...' : 'Importar respaldo (JSON)' }}
            </p>
            <p class="text-xs text-zinc-500">Reemplaza todos los datos actuales</p>
          </div>
          <input type="file" accept=".json" class="hidden" @change="handleImportJson" />
        </label>
      </div>
    </section>

    <section class="rounded-xl border border-danger/30 bg-danger/5 p-6">
      <h2 class="mb-2 text-sm font-medium text-danger">Zona de peligro</h2>
      <p class="mb-4 text-sm text-zinc-400">
        Restablece la base de datos con los datos de prueba iniciales. Se perderán todos los datos actuales.
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-danger/50 px-4 py-2 text-sm text-danger transition hover:bg-danger/10"
        @click="showResetConfirm = true"
      >
        <RefreshCw :size="16" />
        Restablecer datos de prueba
      </button>
    </section>

    <ConfirmDialog
      v-model="showResetConfirm"
      title="Restablecer datos"
      message="¿Estás seguro? Se eliminarán todos los datos y se cargarán los datos de prueba iniciales."
      confirm-label="Restablecer"
      variant="danger"
      @confirm="handleReset"
    />
  </div>
</template>