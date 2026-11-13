import { Outlet } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import Sidebar from '../components/layout/Sidebar'
import { useState } from 'react'

export default function StudentLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-on-background">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-col md:ml-[280px]">
        <Topbar showMenuButton onMenuClick={() => setMobileOpen((value) => !value)} title="GesTask — Gestión Académica" />
        <main className="flex-1 overflow-auto p-margin-mobile md:p-margin-desktop">
          <Outlet />
        </main>
      </div>
    </div>
  )
}