import { defineStore } from 'pinia'
import { useContacts } from '@/composables/useContacts'

export const useContactsStore = defineStore('contacts', () => {
  const contactsApi = useContacts()
  return { ...contactsApi }
})
