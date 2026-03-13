import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogin } from '@/api/hooks'
import { Map, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const login = useLogin()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await login.mutateAsync({ username, password })
      if (res.success && res.data) {
        localStorage.setItem('tripcore_token', res.data.token)
        localStorage.setItem('tripcore_user', JSON.stringify(res.data))
        navigate('/')
      } else {
        setError(res.errors?.[0] || 'Login failed')
      }
    } catch {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Map className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">TripCore</h1>
          <p className="text-[var(--color-muted-foreground)] mt-2">NDIS Trip Management Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--color-card)] rounded-2xl p-8 border border-[var(--color-border)] shadow-xl">
          <h2 className="text-xl font-semibold mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm border border-[var(--color-destructive)]/20">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--color-muted-foreground)]">Username</label>
              <input id="login-username" type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition-shadow"
                placeholder="Enter your username" required autoFocus />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--color-muted-foreground)]">Password</label>
              <div className="relative">
                <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] pr-12 transition-shadow"
                  placeholder="Enter your password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button id="login-submit" type="submit" disabled={login.isPending}
              className="w-full py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary)]/90 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30">
              {login.isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <p className="text-xs text-[var(--color-muted-foreground)] mt-6 text-center">
            Demo: <span className="text-[var(--color-foreground)]">admin</span> / <span className="text-[var(--color-foreground)]">Admin123!</span>
          </p>
        </form>
      </div>
    </div>
  )
}
