<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Check, X, ShoppingCart } from 'lucide-vue-next'
import type { OrderItem } from '@/types'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useOrdersStore } from '@/stores/orders'
import { useAppStore } from '@/stores/app'
import { formatDate } from '@/utils/format'

const router = useRouter()
const ordersStore = useOrdersStore()
const appStore = useAppStore()

const showCreate = ref(false)
const showCompleteConfirm = ref(false)
const completingOrderId = ref<string | null>(null)
const completeAsSale = ref(true)

const newOrder = ref({
  customerName: '',
  customerPhone: '',
  notes: '',
  items: [{ productName: '', quantity: 1 }] as OrderItem[],
})

onMounted(() => ordersStore.loadOrders())

function addItem() {
  newOrder.value.items.push({ productName: '', quantity: 1 })
}

function removeItem(index: number) {
  newOrder.value.items.splice(index, 1)
}

async function handleCreate() {
  const validItems = newOrder.value.items.filter((i) => i.productName.trim())
  if (!newOrder.value.customerName.trim() || validItems.length === 0) {
    appStore.showToast('Completa nombre y al menos un producto', 'error')
    return
  }
  try {
    await ordersStore.createOrder(
      newOrder.value.customerName,
      validItems,
      newOrder.value.customerPhone || undefined,
      newOrder.value.notes || undefined,
    )
    appStore.showToast('Pedido creado', 'success')
    showCreate.value = false
    newOrder.value = { customerName: '', customerPhone: '', notes: '', items: [{ productName: '', quantity: 1 }] }
  } catch {
    appStore.showToast('Error al crear pedido', 'error')
  }
}

function openComplete(id: string, asSale: boolean) {
  completingOrderId.value = id
  completeAsSale.value = asSale
  showCompleteConfirm.value = true
}

async function handleComplete() {
  if (!completingOrderId.value) return
  try {
    if (completeAsSale.value) {
      await ordersStore.updateOrderStatus(completingOrderId.value, 'completed')
      appStore.showToast('Pedido completado. Registra la venta en el módulo de ventas.', 'info')
      router.push('/ventas')
    } else {
      await ordersStore.updateOrderStatus(completingOrderId.value, 'completed')
      appStore.showToast('Pedido marcado como entregado', 'success')
    }
  } catch {
    appStore.showToast('Error al completar pedido', 'error')
  }
}

async function handleCancel(id: string) {
  try {
    await ordersStore.updateOrderStatus(id, 'cancelled')
    appStore.showToast('Pedido cancelado', 'success')
  } catch {
    appStore.showToast('Error al cancelar pedido', 'error')
  }
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
  cancelled: 'bg-zinc-700 text-zinc-400',
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between">
      <p class="text-sm text-zinc-500">
        {{ ordersStore.pendingOrders.length }} pendiente(s) ·
        {{ ordersStore.completedOrders.length }} completado(s)
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        @click="showCreate = true"
      >
        <Plus :size="16" />
        Nuevo pedido
      </button>
    </div>

    <LoadingSpinner v-if="ordersStore.loading" label="Cargando pedidos..." />

    <div v-else class="space-y-3">
      <div
        v-for="order in ordersStore.orders"
        :key="order.id"
        class="rounded-xl border border-border bg-surface-raised p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h3 class="font-medium text-zinc-100">{{ order.customerName }}</h3>
              <span
                class="rounded-md px-2 py-0.5 text-xs font-medium"
                :class="statusColors[order.status]"
              >
                {{ statusLabels[order.status] }}
              </span>
            </div>
            <p class="mt-1 text-sm text-zinc-500">
              {{ formatDate(order.date) }}
              <span v-if="order.customerPhone"> · {{ order.customerPhone }}</span>
            </p>
            <ul class="mt-3 space-y-1">
              <li
                v-for="(item, idx) in order.items"
                :key="idx"
                class="text-sm text-zinc-300"
              >
                {{ item.quantity }}× {{ item.productName }}
              </li>
            </ul>
            <p v-if="order.notes" class="mt-2 text-xs text-zinc-500">{{ order.notes }}</p>
          </div>

          <div v-if="order.status === 'pending'" class="flex shrink-0 gap-2">
            <button
              type="button"
              title="Completar y convertir en venta"
              class="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
              @click="openComplete(order.id, true)"
            >
              <ShoppingCart :size="14" />
              Vender
            </button>
            <button
              type="button"
              title="Marcar como entregado"
              class="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-zinc-300 hover:bg-surface-overlay"
              @click="openComplete(order.id, false)"
            >
              <Check :size="14" />
              Entregar
            </button>
            <button
              type="button"
              title="Cancelar"
              class="rounded-lg p-1.5 text-zinc-500 hover:bg-surface-overlay hover:text-danger"
              @click="handleCancel(order.id)"
            >
              <X :size="16" />
            </button>
          </div>
        </div>
      </div>

      <p v-if="ordersStore.orders.length === 0" class="py-12 text-center text-zinc-500">
        No hay pedidos registrados
      </p>
    </div>

    <AppModal v-model="showCreate" title="Nuevo pedido" size="md">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1 block text-sm text-zinc-400">Cliente *</label>
            <input v-model="newOrder.customerName" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-zinc-400">Teléfono</label>
            <input v-model="newOrder.customerPhone" class="input-field" />
          </div>
        </div>

        <div>
          <label class="mb-2 block text-sm text-zinc-400">Productos *</label>
          <div class="space-y-2">
            <div
              v-for="(item, idx) in newOrder.items"
              :key="idx"
              class="flex gap-2"
            >
              <input
                v-model="item.productName"
                placeholder="Nombre del producto"
                class="input-field flex-1"
              />
              <input
                v-model.number="item.quantity"
                type="number"
                min="1"
                class="input-field w-20"
              />
              <button
                v-if="newOrder.items.length > 1"
                type="button"
                class="rounded p-2 text-zinc-500 hover:text-danger"
                @click="removeItem(idx)"
              >
                <X :size="16" />
              </button>
            </div>
          </div>
          <button
            type="button"
            class="mt-2 text-sm text-accent hover:underline"
            @click="addItem"
          >
            + Agregar producto
          </button>
        </div>

        <div>
          <label class="mb-1 block text-sm text-zinc-400">Notas</label>
          <textarea v-model="newOrder.notes" rows="2" class="input-field resize-none" />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-surface-overlay"
            @click="showCreate = false"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            @click="handleCreate"
          >
            Crear pedido
          </button>
        </div>
      </template>
    </AppModal>

    <ConfirmDialog
      v-model="showCompleteConfirm"
      :title="completeAsSale ? 'Completar y vender' : 'Marcar como entregado'"
      :message="
        completeAsSale
          ? 'El pedido se marcará como completado y serás redirigido al módulo de ventas.'
          : 'El pedido se marcará como entregado sin registrar una venta.'
      "
      :confirm-label="completeAsSale ? 'Ir a ventas' : 'Confirmar'"
      @confirm="handleComplete"
    />
  </div>
</template>