export function cn(...values) {
  return values.filter(Boolean).join(' ')
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function formatDate(value) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function statusLabel(status) {
  return {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    finalizado: 'Finalizado',
  }[status] ?? status
}

export function priorityLabel(priority) {
  return {
    alta: 'Alta',
    media: 'Media',
    baja: 'Baja',
  }[priority] ?? priority
}

export function statusToSelectClass(status) {
  return {
    pendiente: 'bg-surface border-outline-variant text-on-surface',
    en_proceso: 'bg-primary-container border-primary-container text-on-primary-container',
    finalizado: 'bg-secondary-container border-secondary-container text-on-secondary-container',
  }[status] ?? 'bg-surface border-outline-variant text-on-surface'
}

export function statusToBadgeClass(status) {
  return {
    pendiente: 'bg-surface-variant text-on-surface-variant',
    en_proceso: 'bg-primary-fixed text-on-primary-fixed',
    finalizado: 'bg-secondary-fixed text-on-secondary-fixed',
  }[status] ?? 'bg-surface-variant text-on-surface-variant'
}

export function priorityToBadgeClass(priority) {
  return {
    alta: 'bg-error-container text-on-error-container',
    media: 'bg-primary-fixed text-on-primary-fixed',
    baja: 'bg-secondary-fixed text-on-secondary-fixed',
  }[priority] ?? 'bg-surface-variant text-on-surface-variant'
}

export function isOverdue(dueDate, status) {
  if (!dueDate || status === 'finalizado') return false
  return new Date(dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
}