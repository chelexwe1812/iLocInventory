import { computed, ref } from 'vue'
import type { Contact, ContactFormData } from '@/types'
import {
  deleteContact as dbDeleteContact,
  getAllContacts,
  saveContact,
} from '@/services/storage'
import { generateId } from '@/utils/id'

export function useContacts() {
  const contacts = ref<Contact[]>([])
  const loading = ref(false)

  async function loadContacts(): Promise<void> {
    loading.value = true
    try {
      contacts.value = await getAllContacts()
    } finally {
      loading.value = false
    }
  }

  /** Contactos que no son proveedores (los proveedores no participan en ventas) */
  const customers = computed(() => contacts.value.filter((c) => c.type !== 'supplier'))

  const suppliers = computed(() => contacts.value.filter((c) => c.type === 'supplier'))

  function searchContacts(query: string): Contact[] {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return contacts.value
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q),
      )
      .slice(0, 10)
  }

  /** Búsqueda restringida a clientes: excluye proveedores del flujo de ventas */
  function searchCustomers(query: string): Contact[] {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return customers.value
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q),
      )
      .slice(0, 10)
  }

  function getContactById(id: string): Contact | undefined {
    return contacts.value.find((c) => c.id === id)
  }

  async function createContact(data: ContactFormData): Promise<Contact> {
    const now = new Date().toISOString()
    const contact: Contact = {
      ...data,
      name: data.name.trim(),
      type: data.type ?? 'customer',
      phone: data.phone?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    await saveContact(contact)
    await loadContacts()
    return contact
  }

  async function updateContact(id: string, data: Partial<ContactFormData>): Promise<Contact> {
    const existing = contacts.value.find((c) => c.id === id)
    if (!existing) throw new Error('Contacto no encontrado')

    const updated: Contact = {
      ...existing,
      ...data,
      name: (data.name ?? existing.name).trim(),
      phone: (data.phone ?? existing.phone)?.trim() || undefined,
      notes: (data.notes ?? existing.notes)?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    }
    await saveContact(updated)
    await loadContacts()
    return updated
  }

  async function removeContact(id: string): Promise<void> {
    await dbDeleteContact(id)
    await loadContacts()
  }

  return {
    contacts,
    customers,
    suppliers,
    loading,
    loadContacts,
    searchContacts,
    searchCustomers,
    getContactById,
    createContact,
    updateContact,
    removeContact,
  }
}
