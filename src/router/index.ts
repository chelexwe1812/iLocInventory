import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: 'Dashboard' },
    },
    {
      path: '/inventario',
      name: 'inventory',
      component: () => import('@/views/InventoryView.vue'),
      meta: { title: 'Inventario' },
    },
    {
      path: '/ventas',
      name: 'sales',
      component: () => import('@/views/SalesView.vue'),
      meta: { title: 'Nueva Venta' },
    },
    {
      path: '/ventas/historial',
      name: 'sales-history',
      component: () => import('@/views/SalesHistoryView.vue'),
      meta: { title: 'Ventas' },
    },
    {
      path: '/compras',
      name: 'purchase-orders',
      component: () => import('@/views/PurchaseOrdersView.vue'),
      meta: { title: 'Pedidos de Compra' },
    },
    {
      path: '/contactos',
      name: 'contacts',
      component: () => import('@/views/ContactsView.vue'),
      meta: { title: 'Contactos' },
    },
    {
      path: '/configuracion',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { title: 'Configuración' },
    },
  ],
})

router.afterEach((to) => {
  document.title = `${to.meta.title ?? 'iLoc'} — iLoc Inventory`
})

export default router