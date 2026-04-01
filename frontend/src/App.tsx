import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePermissions, type PageKey } from './lib/permissions'
import AppLayout from './components/layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import TripsPage from './pages/TripsPage'
import TripDetailPage from './pages/TripDetailPage'
import TripCreatePage from './pages/TripCreatePage'
import ParticipantsPage from './pages/ParticipantsPage'
import ParticipantCreatePage from './pages/ParticipantCreatePage'
import ParticipantDetailPage from './pages/ParticipantDetailPage'
import AccommodationPage from './pages/AccommodationPage'
import AccommodationDetailPage from './pages/AccommodationDetailPage'
import AccommodationCreatePage from './pages/AccommodationCreatePage'
import VehiclesPage from './pages/VehiclesPage'
import VehicleCreatePage from './pages/VehicleCreatePage'
import StaffPage from './pages/StaffPage'
import StaffCreatePage from './pages/StaffCreatePage'
import TasksPage from './pages/TasksPage'
import TaskCreatePage from './pages/TaskCreatePage'
import IncidentsPage from './pages/IncidentsPage'
import IncidentCreatePage from './pages/IncidentCreatePage'
import BookingsPage from './pages/BookingsPage'
import SchedulePage from './pages/SchedulePage'
import SettingsPage from './pages/SettingsPage'
import QualificationsPage from './pages/QualificationsPage'
import ClaimDetailPage from './pages/ClaimDetailPage'
import LoginPage from './pages/LoginPage'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

function PrivateRoute({ children, page, requiresWrite }: { children: React.ReactNode; page?: PageKey; requiresWrite?: boolean }) {
  const token = localStorage.getItem('tripcore_token')
  const permissions = usePermissions()
  if (!token) return <Navigate to="/login" replace />
  if (page && !permissions.canAccessPage(page)) return <Navigate to="/" replace />
  if (requiresWrite && !permissions.canWrite) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="/" element={<PrivateRoute page="dashboard"><DashboardPage /></PrivateRoute>} />
            <Route path="/trips" element={<PrivateRoute page="trips"><TripsPage /></PrivateRoute>} />
            <Route path="/trips/new" element={<PrivateRoute page="trips" requiresWrite><TripCreatePage /></PrivateRoute>} />
            <Route path="/trips/:id" element={<PrivateRoute page="trips"><TripDetailPage /></PrivateRoute>} />
            <Route path="/schedule" element={<PrivateRoute page="schedule"><SchedulePage /></PrivateRoute>} />
            <Route path="/participants" element={<PrivateRoute page="participants"><ParticipantsPage /></PrivateRoute>} />
            <Route path="/participants/new" element={<PrivateRoute page="participants" requiresWrite><ParticipantCreatePage /></PrivateRoute>} />
            <Route path="/participants/:id" element={<PrivateRoute page="participants"><ParticipantDetailPage /></PrivateRoute>} />
            <Route path="/participants/:id/edit" element={<PrivateRoute page="participants" requiresWrite><ParticipantCreatePage /></PrivateRoute>} />
            <Route path="/accommodation" element={<PrivateRoute page="accommodation"><AccommodationPage /></PrivateRoute>} />
            <Route path="/accommodation/new" element={<PrivateRoute page="accommodation"><AccommodationCreatePage /></PrivateRoute>} />
            <Route path="/accommodation/:id" element={<PrivateRoute page="accommodation"><AccommodationDetailPage /></PrivateRoute>} />
            <Route path="/accommodation/:id/edit" element={<PrivateRoute page="accommodation"><AccommodationCreatePage /></PrivateRoute>} />
            <Route path="/vehicles" element={<PrivateRoute page="vehicles"><VehiclesPage /></PrivateRoute>} />
            <Route path="/vehicles/new" element={<PrivateRoute page="vehicles"><VehicleCreatePage /></PrivateRoute>} />
            <Route path="/vehicles/:id/edit" element={<PrivateRoute page="vehicles"><VehicleCreatePage /></PrivateRoute>} />
            <Route path="/staff" element={<PrivateRoute page="staff"><StaffPage /></PrivateRoute>} />
            <Route path="/staff/new" element={<PrivateRoute page="staff"><StaffCreatePage /></PrivateRoute>} />
            <Route path="/staff/:id/edit" element={<PrivateRoute page="staff"><StaffCreatePage /></PrivateRoute>} />
            <Route path="/tasks" element={<PrivateRoute page="tasks"><TasksPage /></PrivateRoute>} />
            <Route path="/tasks/new" element={<PrivateRoute page="tasks" requiresWrite><TaskCreatePage /></PrivateRoute>} />
            <Route path="/tasks/:id/edit" element={<PrivateRoute page="tasks" requiresWrite><TaskCreatePage /></PrivateRoute>} />
            <Route path="/incidents" element={<PrivateRoute page="incidents"><IncidentsPage /></PrivateRoute>} />
            <Route path="/incidents/new" element={<PrivateRoute page="incidents"><IncidentCreatePage /></PrivateRoute>} />
            <Route path="/incidents/:id/edit" element={<PrivateRoute page="incidents"><IncidentCreatePage /></PrivateRoute>} />
            <Route path="/bookings" element={<PrivateRoute page="bookings"><BookingsPage /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute page="settings"><SettingsPage /></PrivateRoute>} />
            <Route path="/qualifications" element={<PrivateRoute page="qualifications"><QualificationsPage /></PrivateRoute>} />
            <Route path="/claims/:id" element={<PrivateRoute page="claims"><ClaimDetailPage /></PrivateRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
