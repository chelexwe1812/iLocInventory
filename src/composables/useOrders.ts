import { computed, ref } from 'vue'
import type { Order, OrderItem, OrderStatus } from '@/types'
import { deleteOrder, getAllOrders, saveOrder } from '@/services/storage'
import { generateId } from '@/utils/id'

export function useOrders() {
  const orders = ref<Order[]>([])
  const loading = ref(false)

  async function loadOrders(): Promise<void> {
    loading.value = true
    try {
      orders.value = await getAllOrders()
    } finally {
      loading.value = false
    }
  }

  const pendingOrders = computed(() => orders.value.filter((o) => o.status === 'pending'))

  const completedOrders = computed(() => orders.value.filter((o) => o.status === 'completed'))

  async function createOrder(
    customerName: string,
    items: OrderItem[],
    customerPhone?: string,
    notes?: string,
  ): Promise<Order> {
    const now = new Date().toISOString()
    const order: Order = {
      id: generateId(),
      date: now,
      customerName,
      customerPhone,
      items,
      status: 'pending',
      notes,
      createdAt: now,
      updatedAt: now,
    }
    await saveOrder(order)
    await loadOrders()
    return order
  }

  async function updateOrderStatus(
    id: string,
    status: OrderStatus,
    relatedSaleId?: string,
  ): Promise<void> {
    const order = orders.value.find((o) => o.id === id)
    if (!order) throw new Error('Pedido no encontrado')

    await saveOrder({
      ...order,
      status,
      relatedSaleId,
      updatedAt: new Date().toISOString(),
    })
    await loadOrders()
  }

  async function removeOrder(id: string): Promise<void> {
    await deleteOrder(id)
    await loadOrders()
  }

  return {
    orders,
    loading,
    pendingOrders,
    completedOrders,
    loadOrders,
    createOrder,
    updateOrderStatus,
    removeOrder,
  }
}