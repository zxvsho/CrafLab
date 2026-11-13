import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-on-background">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-col md:ml-[280px]">
        <Topbar showMenuButton onMenuClick={() => setMobileOpen((value) => !value)} title="GesTask — Administración" />
        <main className="flex-1 overflow-auto p-margin-mobile md:p-margin-desktop">
          <Outlet />
        </main>
      </div>
    </div>
  )
}