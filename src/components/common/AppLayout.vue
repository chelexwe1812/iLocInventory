<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import GlobalSearch from './GlobalSearch.vue'
import ToastNotification from './ToastNotification.vue'
import { useStorage } from '@/composables/useStorage'
import LoadingSpinner from './LoadingSpinner.vue'

const route = useRoute()
const { ready, loading, backend } = useStorage()

const pageTitle = computed(() => (route.meta.title as string) ?? 'iLoc Inventory')
</script>

<template>
  <div v-if="!ready && loading" class="flex h-screen items-center justify-center bg-surface">
    <LoadingSpinner size="lg" label="Inicializando base de datos local..." />
  </div>

  <div v-else class="flex h-screen overflow-hidden bg-surface">
    <AppSidebar />

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface-raised px-6"
      >
        <h1 class="text-lg font-semibold text-zinc-100">{{ pageTitle }}</h1>
        <div class="flex items-center gap-4">
          <GlobalSearch />
          <span
            class="hidden rounded-md border border-border px-2 py-1 text-xs text-zinc-500 lg:inline"
            :title="`Almacenamiento: ${backend.toUpperCase()}`"
          >
            {{ backend === 'opfs' ? 'OPFS' : 'IndexedDB' }}
          </span>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>

    <ToastNotification />
  </div>
</template>