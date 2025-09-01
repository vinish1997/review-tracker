import { useContext } from 'react'
import ToastCtx from './ToastContext'

export default function useToast() {
  return useContext(ToastCtx) || { show: () => {}, remove: () => {} };
}

