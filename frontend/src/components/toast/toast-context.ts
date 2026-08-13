import { createContext } from 'react'

export type ToastTone = 'success' | 'error'

export type Toast = {
  id: number
  tone: ToastTone
  message: string
  detail?: string
}

export type ToastContextValue = {
  notify: (toast: Omit<Toast, 'id'>) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
