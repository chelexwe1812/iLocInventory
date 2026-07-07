<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import LockScreenView from '@/views/LockScreenView.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useAuth } from '@/composables/useAuth'
import { useStorage } from '@/composables/useStorage'

const { ready: storageReady, loading } = useStorage()
const { ready: authReady, unlocked } = useAuth()
</script>

<template>
  <div v-if="!storageReady && loading" class="flex h-screen items-center justify-center bg-surface">
    <LoadingSpinner size="lg" label="Inicializando base de datos local..." />
  </div>

  <LockScreenView v-else-if="authReady && !unlocked" />

  <AppLayout v-else-if="authReady && unlocked">
    <RouterView />
  </AppLayout>
</template>