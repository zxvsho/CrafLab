import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import StudentLayout from './layouts/StudentLayout'
import Dashboard from './pages/admin/Dashboard'
import Projects from './pages/admin/Projects'
import ProjectDetail from './pages/admin/ProjectDetail'
import Kanban from './pages/admin/Kanban'
import Reports from './pages/admin/Reports'
import MyTasks from './pages/student/MyTasks'
import AcademicManagement from './pages/admin/AcademicManagement'
import TeacherGradebook from './pages/teacher/Gradebook'
import MyAcademic from './pages/student/MyAcademic'
import AcademicDashboard from './pages/admin/AcademicDashboard'

const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface">
    Cargando...
  </div>
)

function ProtectedRoute({ children, allowedRole }) {
  const { user, profile, loading, profileLoading } = useAuth()

  // 1. Todavía resolviendo la sesión inicial
  if (loading) return <Spinner />

  // 2. Sesión confirmada pero el perfil aún no llegó de Supabase
  //    → esperar en lugar de evaluar el rol con profile === null
  if (user && profileLoading) return <Spinner />

  // 3. Sin sesión → login
  if (!user) return <Navigate to="/login" replace />

  // 4. Rol incorrecto → login
  if (!profile) return <Navigate to="/login" replace />

  if (allowedRole && profile.role !== allowedRole) {
    if (profile.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (profile.role === 'teacher') return <Navigate to="/teacher/grades" replace />
    if (profile.role === 'student') return <Navigate to="/student/academic" replace />
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={(
            <ProtectedRoute allowedRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AcademicDashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="projects/:id/kanban" element={<Kanban />} />
          <Route path="reports" element={<Reports />} />
          <Route path="legacy-dashboard" element={<Dashboard />} />
          <Route path="students" element={<AcademicManagement resource="students" />} />
          <Route path="teachers" element={<AcademicManagement resource="teachers" />} />
          <Route path="subjects" element={<AcademicManagement resource="subjects" />} />
          <Route path="groups" element={<AcademicManagement resource="groups" />} />
          <Route path="enrollments" element={<AcademicManagement resource="enrollments" />} />
          <Route path="grades" element={<AcademicManagement resource="grades" />} />
        </Route>

        <Route
          path="/teacher"
          element={(
            <ProtectedRoute allowedRole="teacher">
              <StudentLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<Navigate to="grades" replace />} />
          <Route path="grades" element={<TeacherGradebook />} />
        </Route>

        <Route
          path="/student"
          element={(
            <ProtectedRoute allowedRole="student">
              <StudentLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<Navigate to="academic" replace />} />
          <Route path="academic" element={<MyAcademic />} />
          <Route path="tasks" element={<MyTasks />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
