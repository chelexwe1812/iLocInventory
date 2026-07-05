<script setup lang="ts">
import { onMounted } from 'vue'
import SaleWizard from '@/components/sales/SaleWizard.vue'
import { useProductsStore } from '@/stores/products'
import { useSalesStore } from '@/stores/sales'

const productsStore = useProductsStore()
const salesStore = useSalesStore()

onMounted(async () => {
  await Promise.all([productsStore.loadProducts(), salesStore.loadSales()])
})
</script>

<template>
  <SaleWizard />
</template>