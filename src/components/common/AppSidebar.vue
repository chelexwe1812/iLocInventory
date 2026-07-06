<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Smartphone,
  ChevronLeft,
  History,
  Users,
  Truck,
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { useStoreInfo } from '@/composables/useStoreInfo'

const route = useRoute()
const appStore = useAppStore()
const { sidebarCollapsed } = storeToRefs(appStore)
const { name: storeName, description: storeDescription } = useStoreInfo()

const navItems = computed(() => [
  { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'inventory', label: 'Inventario', icon: Package, path: '/inventario' },
  { name: 'sales', label: 'Nueva Venta', icon: ShoppingCart, path: '/ventas' },
  { name: 'sales-history', label: 'Ventas', icon: History, path: '/ventas/historial' },
  { name: 'purchase-orders', label: 'Pedidos de Compra', icon: Truck, path: '/compras' },
  { name: 'contacts', label: 'Contactos', icon: Users, path: '/contactos' },
  { name: 'settings', label: 'Configuración', icon: Settings, path: '/configuracion' },
])

function isActive(name: string): boolean {
  return route.name === name
}
</script>

<template>
  <aside
    class="relative flex h-screen shrink-0 flex-col border-r border-border bg-surface-raised transition-all duration-200"
    :class="sidebarCollapsed ? 'w-16' : 'w-60'"
  >
    <button
      type="button"
      class="absolute -right-3 top-16 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface-raised text-zinc-400 shadow-sm transition hover:border-accent hover:text-accent"
      :title="sidebarCollapsed ? 'Expandir menú' : 'Minimizar menú'"
      @click="appStore.toggleSidebar"
    >
      <ChevronLeft
        :size="14"
        class="transition-transform"
        :class="sidebarCollapsed ? 'rotate-180' : ''"
      />
    </button>

    <div class="flex h-14 items-center gap-3 border-b border-border px-4">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
        <Smartphone :size="18" class="text-white" />
      </div>
      <div v-if="!sidebarCollapsed" class="min-w-0">
        <p class="truncate text-sm font-semibold text-zinc-100">{{ storeName || 'iLoc Inventory' }}</p>
        <p v-if="storeDescription" class="truncate text-xs text-zinc-500">{{ storeDescription }}</p>
      </div>
    </div>

    <nav class="flex-1 space-y-1 p-3">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
        :class="
          isActive(item.name)
            ? 'bg-accent/15 text-accent'
            : 'text-zinc-400 hover:bg-surface-overlay hover:text-zinc-100'
        "
        :title="sidebarCollapsed ? item.label : undefined"
      >
        <component :is="item.icon" :size="18" class="shrink-0" />
        <span v-if="!sidebarCollapsed" class="flex-1">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>