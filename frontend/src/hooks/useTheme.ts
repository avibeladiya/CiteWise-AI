import { useEffect } from 'react'
import { useUIStore } from '@/store/useUIStore'

export function useTheme() {
  const { dark, toggleDark } = useUIStore()
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  return { dark, toggleDark }
}
