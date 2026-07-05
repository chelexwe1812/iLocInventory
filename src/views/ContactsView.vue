<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Search, Pencil, Trash2, Phone, ShoppingBag, User } from 'lucide-vue-next'
import type { Contact } from '@/types'
import ContactFormModal from '@/components/contacts/ContactFormModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useContactsStore } from '@/stores/contacts'
import { useSalesStore } from '@/stores/sales'
import { useAppStore } from '@/stores/app'
import { formatCurrency, formatDate } from '@/utils/format'

const contactsStore = useContactsStore()
const salesStore = useSalesStore()
const appStore = useAppStore()

const search = ref('')
const showForm = ref(false)
const editing = ref<Contact | null>(null)
const showDeleteConfirm = ref(false)
const deletingId = ref<string | null>(null)

onMounted(() => {
  contactsStore.loadContacts()
  if (salesStore.sales.length === 0) salesStore.loadSales()
})

// Estadísticas de compras por contacto: nº de ventas, total gastado y última compra.
const statsByContact = computed(() => {
  const map = new Map<string, { count: number; total: number; lastDate: string }>()
  for (const sale of salesStore.sales) {
    if (!sale.contactId) continue
    const current = map.get(sale.contactId) ?? { count: 0, total: 0, lastDate: '' }
    current.count++
    current.total += sale.total
    if (!current.lastDate || sale.date > current.lastDate) current.lastDate = sale.date
    map.set(sale.contactId, current)
  }
  return map
})

const filteredContacts = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return contactsStore.contacts
  return contactsStore.contacts.filter(
    (c) => c.name.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q),
  )
})

function openCreate() {
  editing.value = null
  showForm.value = true
}

function openEdit(contact: Contact) {
  editing.value = contact
  showForm.value = true
}

async function handleSave(data: { name: string; phone?: string; notes?: string }) {
  try {
    if (editing.value) {
      await contactsStore.updateContact(editing.value.id, data)
      appStore.showToast('Contacto actualizado', 'success')
    } else {
      await contactsStore.createContact(data)
      appStore.showToast('Contacto creado', 'success')
    }
    showForm.value = false
  } catch {
    appStore.showToast('Error al guardar el contacto', 'error')
  }
}

function askDelete(id: string) {
  deletingId.value = id
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingId.value) return
  try {
    await contactsStore.removeContact(deletingId.value)
    appStore.showToast('Contacto eliminado', 'success')
  } catch {
    appStore.showToast('Error al eliminar el contacto', 'error')
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="relative w-full max-w-xs">
        <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          v-model="search"
          type="search"
          placeholder="Buscar contacto..."
          class="w-full rounded-lg border border-border bg-surface-raised py-2 pl-10 pr-4 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        @click="openCreate"
      >
        <Plus :size="16" />
        Nuevo contacto
      </button>
    </div>

    <LoadingSpinner v-if="contactsStore.loading" label="Cargando contactos..." />

    <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="contact in filteredContacts"
        :key="contact.id"
        class="group rounded-xl border border-border bg-surface-raised p-5"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <User :size="18" />
            </div>
            <div class="min-w-0">
              <h3 class="truncate font-medium text-zinc-100">{{ contact.name }}</h3>
              <p
                v-if="contact.phone"
                class="mt-0.5 flex items-center gap-1.5 text-sm text-zinc-400"
              >
                <Phone :size="13" /> {{ contact.phone }}
              </p>
            </div>
          </div>
          <div class="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              title="Editar"
              class="rounded-lg p-1.5 text-zinc-400 hover:bg-surface-overlay hover:text-zinc-100"
              @click="openEdit(contact)"
            >
              <Pencil :size="15" />
            </button>
            <button
              type="button"
              title="Eliminar"
              class="rounded-lg p-1.5 text-zinc-500 hover:bg-surface-overlay hover:text-danger"
              @click="askDelete(contact.id)"
            >
              <Trash2 :size="15" />
            </button>
          </div>
        </div>

        <p v-if="contact.notes" class="mt-3 line-clamp-3 text-sm text-zinc-500">
          {{ contact.notes }}
        </p>

        <div class="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs">
          <span class="flex items-center gap-1.5 text-zinc-400">
            <ShoppingBag :size="13" />
            {{ statsByContact.get(contact.id)?.count ?? 0 }} compra(s)
          </span>
          <span class="font-medium text-zinc-200">
            {{ formatCurrency(statsByContact.get(contact.id)?.total ?? 0) }}
          </span>
          <span
            v-if="statsByContact.get(contact.id)?.lastDate"
            class="ml-auto text-zinc-500"
          >
            Últ. {{ formatDate(statsByContact.get(contact.id)!.lastDate) }}
          </span>
        </div>
      </div>

      <p
        v-if="filteredContacts.length === 0"
        class="col-span-full py-12 text-center text-zinc-500"
      >
        {{ search ? 'Sin resultados' : 'No hay contactos registrados' }}
      </p>
    </div>

    <ContactFormModal v-model="showForm" :contact="editing" @save="handleSave" />

    <ConfirmDialog
      v-model="showDeleteConfirm"
      title="Eliminar contacto"
      message="¿Seguro que deseas eliminar este contacto? Las ventas asociadas conservarán el nombre del cliente."
      confirm-label="Eliminar"
      variant="danger"
      @confirm="handleDelete"
    />
  </div>
</template>
