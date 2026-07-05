<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, PackageCheck, Pencil, X, Truck, Trash2, Calendar, FileDown } from 'lucide-vue-next'
import type { PurchaseOrder, PurchaseOrderFormData, PurchaseOrderStatus } from '@/types'
import PurchaseOrderFormModal from '@/components/purchase/PurchaseOrderFormModal.vue'
import ReceivePurchaseOrderModal from '@/components/purchase/ReceivePurchaseOrderModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { usePurchaseOrdersStore } from '@/stores/purchaseOrders'
import { useProductsStore } from '@/stores/products'
import { useContactsStore } from '@/stores/contacts'
import { useAppStore } from '@/stores/app'
import { CONDITION_LABELS } from '@/utils/product'
import { downloadPurchaseOrder } from '@/services/pdf'
import { formatCurrency, formatDate } from '@/utils/format'

const store = usePurchaseOrdersStore()
const productsStore = useProductsStore()
const contactsStore = useContactsStore()
const appStore = useAppStore()

const showForm = ref(false)
const editingOrder = ref<PurchaseOrder | null>(null)
const showReceive = ref(false)
const receivingOrder = ref<PurchaseOrder | null>(null)
const showCancelConfirm = ref(false)
const cancelingId = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const deletingId = ref<string | null>(null)

onMounted(() => {
  store.loadPurchaseOrders()
  productsStore.loadProducts()
  contactsStore.loadContacts()
})

const statusLabels: Record<PurchaseOrderStatus, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  received: 'Recibido',
  cancelled: 'Cancelado',
}

const statusColors: Record<PurchaseOrderStatus, string> = {
  pending: 'bg-warning/20 text-warning',
  partial: 'bg-sky-500/20 text-sky-400',
  received: 'bg-success/20 text-success',
  cancelled: 'bg-zinc-700 text-zinc-400',
}

function itemName(item: PurchaseOrder['items'][number]): string {
  return [item.brand, item.model, item.variant].filter(Boolean).join(' ')
}

function openCreate() {
  editingOrder.value = null
  showForm.value = true
}

function openEdit(order: PurchaseOrder) {
  editingOrder.value = order
  showForm.value = true
}

async function handleSave(data: PurchaseOrderFormData) {
  try {
    if (editingOrder.value) {
      await store.updatePurchaseOrder(editingOrder.value.id, data)
      appStore.showToast('Orden de compra actualizada', 'success')
    } else {
      await store.createPurchaseOrder(data)
      appStore.showToast('Orden de compra creada', 'success')
    }
    showForm.value = false
  } catch (e) {
    appStore.showToast(e instanceof Error ? e.message : 'Error al guardar la orden', 'error')
  }
}

function openReceive(order: PurchaseOrder) {
  receivingOrder.value = order
  showReceive.value = true
}

async function handleReceive(receipts: Record<number, number>) {
  if (!receivingOrder.value) return
  try {
    await store.receivePurchaseOrder(receivingOrder.value.id, receipts)
    await productsStore.loadProducts()
    appStore.showToast('Mercancía recibida e ingresada a inventario', 'success')
  } catch (e) {
    appStore.showToast(e instanceof Error ? e.message : 'Error al recibir la mercancía', 'error')
  }
}

function askCancel(id: string) {
  cancelingId.value = id
  showCancelConfirm.value = true
}

async function handleCancel() {
  if (!cancelingId.value) return
  try {
    await store.cancelPurchaseOrder(cancelingId.value)
    appStore.showToast('Orden de compra cancelada', 'success')
  } catch {
    appStore.showToast('Error al cancelar la orden', 'error')
  } finally {
    cancelingId.value = null
  }
}

function askDelete(id: string) {
  deletingId.value = id
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingId.value) return
  try {
    await store.removePurchaseOrder(deletingId.value)
    appStore.showToast('Orden de compra eliminada', 'success')
  } catch {
    appStore.showToast('Error al eliminar la orden', 'error')
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <p class="text-sm text-zinc-500">
        {{ store.openPurchaseOrders.length }} por recibir · {{ store.purchaseOrders.length }} en total
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        @click="openCreate"
      >
        <Plus :size="16" />
        Nueva orden de compra
      </button>
    </div>

    <LoadingSpinner v-if="store.loading" label="Cargando órdenes de compra..." />

    <div v-else class="space-y-3">
      <div
        v-for="order in store.purchaseOrders"
        :key="order.id"
        class="rounded-xl border border-border bg-surface-raised p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-3">
              <h3 class="font-medium text-zinc-100">{{ order.code }}</h3>
              <span
                class="rounded-md px-2 py-0.5 text-xs font-medium"
                :class="statusColors[order.status]"
              >
                {{ statusLabels[order.status] }}
              </span>
              <span class="flex items-center gap-1.5 text-sm text-zinc-400">
                <Truck :size="14" /> {{ order.supplierName }}
              </span>
            </div>
            <p class="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
              <span>{{ formatDate(order.date) }}</span>
              <span v-if="order.expectedDate" class="flex items-center gap-1">
                <Calendar :size="13" /> Entrega: {{ formatDate(order.expectedDate) }}
              </span>
            </p>

            <ul class="mt-3 space-y-1">
              <li
                v-for="(item, idx) in order.items"
                :key="idx"
                class="flex items-center gap-2 text-sm text-zinc-300"
              >
                <span class="tabular-nums text-zinc-500">
                  {{ item.receivedQuantity }}/{{ item.quantity }}×
                </span>
                <span class="truncate">{{ itemName(item) }}</span>
                <span
                  class="rounded px-1.5 py-0.5 text-xs font-medium"
                  :class="item.condition === 'nuevo' ? 'bg-accent/15 text-accent' : 'bg-warning/15 text-warning'"
                >
                  {{ CONDITION_LABELS[item.condition] }}
                </span>
                <span class="ml-auto text-xs text-zinc-500">
                  {{ formatCurrency(item.unitCost * item.quantity) }}
                </span>
              </li>
            </ul>

            <p v-if="order.notes" class="mt-2 text-xs text-zinc-500">{{ order.notes }}</p>

            <p class="mt-3 text-sm text-zinc-400">
              Total: <span class="font-semibold text-zinc-100">{{ formatCurrency(order.total) }}</span>
            </p>
          </div>

          <div class="flex shrink-0 flex-col items-end gap-2">
            <div class="flex gap-2">
              <button
                type="button"
                title="Descargar orden en PDF"
                class="rounded-lg border border-border p-1.5 text-zinc-400 hover:border-accent hover:text-accent"
                @click="downloadPurchaseOrder(order)"
              >
                <FileDown :size="15" />
              </button>
            </div>
            <div v-if="order.status === 'pending' || order.status === 'partial'" class="flex gap-2">
              <button
                type="button"
                title="Recibir mercancía"
                class="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
                @click="openReceive(order)"
              >
                <PackageCheck :size="14" />
                Recibir
              </button>
              <button
                v-if="order.status === 'pending'"
                type="button"
                title="Editar"
                class="rounded-lg border border-border p-1.5 text-zinc-400 hover:bg-surface-overlay hover:text-zinc-100"
                @click="openEdit(order)"
              >
                <Pencil :size="15" />
              </button>
              <button
                type="button"
                title="Cancelar"
                class="rounded-lg p-1.5 text-zinc-500 hover:bg-surface-overlay hover:text-danger"
                @click="askCancel(order.id)"
              >
                <X :size="16" />
              </button>
            </div>
            <button
              v-else
              type="button"
              title="Eliminar"
              class="rounded-lg p-1.5 text-zinc-500 hover:bg-surface-overlay hover:text-danger"
              @click="askDelete(order.id)"
            >
              <Trash2 :size="15" />
            </button>
          </div>
        </div>
      </div>

      <p v-if="store.purchaseOrders.length === 0" class="py-12 text-center text-zinc-500">
        No hay órdenes de compra registradas
      </p>
    </div>

    <PurchaseOrderFormModal v-model="showForm" :order="editingOrder" @save="handleSave" />
    <ReceivePurchaseOrderModal v-model="showReceive" :order="receivingOrder" @receive="handleReceive" />

    <ConfirmDialog
      v-model="showCancelConfirm"
      title="Cancelar orden de compra"
      message="La orden quedará cancelada. Las recepciones ya registradas no se revierten."
      confirm-label="Cancelar orden"
      variant="danger"
      @confirm="handleCancel"
    />
    <ConfirmDialog
      v-model="showDeleteConfirm"
      title="Eliminar orden de compra"
      message="¿Seguro que deseas eliminar esta orden? Esta acción no se puede deshacer."
      confirm-label="Eliminar"
      variant="danger"
      @confirm="handleDelete"
    />
  </div>
</template>
