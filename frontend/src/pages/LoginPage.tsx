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
    <div className="min-h-screen flex items-center justify-center bg-[#fbf9f5] p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#396200] to-[#4d7c0f] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#396200]/20">
            <Map className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1b1c1a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>TripCore</h1>
          <p className="text-[#43493a] mt-2">NDIS Trip Management Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-[0_24px_32px_-12px_rgba(27,28,26,0.08)]">
          <h2 className="text-xl font-semibold mb-6 text-[#1b1c1a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-[#ffdad6] text-[#93000a] text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[#43493a]">Username</label>
              <input id="login-username" type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f5f3ef] text-[#1b1c1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all"
                placeholder="Enter your username" required autoFocus />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-[#43493a]">Password</label>
              <div className="relative">
                <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#f5f3ef] text-[#1b1c1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 pr-12 transition-all"
                  placeholder="Enter your password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#43493a] hover:text-[#1b1c1a] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button id="login-submit" type="submit" disabled={login.isPending}
              className="w-full py-2.5 rounded-full bg-gradient-to-br from-[#396200] to-[#4d7c0f] text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-[#396200]/20">
              {login.isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <p className="text-xs text-[#43493a] mt-6 text-center">
            Contact your administrator for login credentials.
          </p>
        </form>
      </div>
    </div>
  )
}
