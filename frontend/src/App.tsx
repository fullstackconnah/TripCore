import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
import BookingsPage from './pages/BookingsPage'
import SchedulePage from './pages/SchedulePage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('tripcore_token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/trips/new" element={<TripCreatePage />} />
            <Route path="/trips/:id" element={<TripDetailPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/participants" element={<ParticipantsPage />} />
            <Route path="/participants/new" element={<ParticipantCreatePage />} />
            <Route path="/participants/:id" element={<ParticipantDetailPage />} />
            <Route path="/participants/:id/edit" element={<ParticipantCreatePage />} />
            <Route path="/accommodation" element={<AccommodationPage />} />
            <Route path="/accommodation/new" element={<AccommodationCreatePage />} />
            <Route path="/accommodation/:id" element={<AccommodationDetailPage />} />
            <Route path="/accommodation/:id/edit" element={<AccommodationCreatePage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/vehicles/new" element={<VehicleCreatePage />} />
            <Route path="/vehicles/:id/edit" element={<VehicleCreatePage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/staff/new" element={<StaffCreatePage />} />
            <Route path="/staff/:id/edit" element={<StaffCreatePage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/new" element={<TaskCreatePage />} />
            <Route path="/tasks/:id/edit" element={<TaskCreatePage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
