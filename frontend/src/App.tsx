import { useEffect } from 'react'
import { LandingPage } from '@/pages/LandingPage'
import { WorkspacePage } from '@/pages/WorkspacePage'
import { Toaster } from '@/components/ui/Toast'
import { useUIStore } from '@/store/useUIStore'

export default function App() {
  const view = useUIStore((s) => s.view)
  const dark  = useUIStore((s) => s.dark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <>
      {view === 'landing' ? <LandingPage /> : <WorkspacePage />}
      <Toaster />
    </>
  )
}
