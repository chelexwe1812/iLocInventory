import type { Component } from 'vue'
import {
  Smartphone,
  Tablet,
  Watch,
  Laptop,
  Headphones,
  Package,
} from 'lucide-vue-next'
import type { ProductCategory } from '@/types'

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  celular: 'Celular',
  tablet: 'Tablet',
  smartwatch: 'Smart Watch',
  computadora: 'Computadora',
  accesorio: 'Accesorio',
  otro: 'Otro',
}

export const CATEGORY_ICONS: Record<ProductCategory, Component> = {
  celular: Smartphone,
  tablet: Tablet,
  smartwatch: Watch,
  computadora: Laptop,
  accesorio: Headphones,
  otro: Package,
}

export const CATEGORY_ICON_CLASS: Record<ProductCategory, string> = {
  celular: 'text-accent',
  tablet: 'text-violet-400',
  smartwatch: 'text-pink-400',
  computadora: 'text-cyan-400',
  accesorio: 'text-emerald-400',
  otro: 'text-zinc-500',
}

export const ALL_CATEGORIES: ProductCategory[] = [
  'celular',
  'tablet',
  'smartwatch',
  'computadora',
  'accesorio',
  'otro',
]

export function getCategoryLabel(category: ProductCategory): string {
  return CATEGORY_LABELS[category]
}

export function getCategoryIcon(category: ProductCategory): Component {
  return CATEGORY_ICONS[category] ?? Package
}

export function getCategoryIconClass(category: ProductCategory): string {
  return CATEGORY_ICON_CLASS[category] ?? 'text-zinc-500'
}