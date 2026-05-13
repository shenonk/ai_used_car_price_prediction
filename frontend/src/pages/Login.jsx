import { useEffect, useState } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { login, loginWithGoogle } from "../utils/auth"
import logo from "../assets/logo/autovaluelk-logo.png"
import LoadingOverlay from "../components/auth/LoadingOverlay"
import SuccessToast from "../components/auth/SuccessToast"

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const authMessage = location.state?.authMessage || ""
  const authSubMessage = location.state?.authSubMessage || "Please sign in to continue."
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [showSuccess, setShowSuccess] = useState(Boolean(authMessage))

  useEffect(() => {
    if (!authMessage) {
      return
    }

    const timeout = window.setTimeout(() => {
      setShowSuccess(false)
      navigate(location.pathname, { replace: true, state: {} })
    }, 3000)

    return () => window.clearTimeout(timeout)
  }, [authMessage, location.pathname, navigate])

  const handleGoogleLogin = async () => {
    setError("")
    setIsLoading(true)
    const result = await loginWithGoogle()
    if (!result.success) {
      setIsLoading(false)
      setError(result.error)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const result = await login(email, password)
    setIsLoading(false)

    if (result.success) {
      setShowSuccess(true)
      setTimeout(() => {
        navigate("/dashboard")
      }, 2000)
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden auth-scanlines">
      <LoadingOverlay isOpen={isLoading} message="Connecting to AutoValueLK..." />
      <SuccessToast
        isOpen={showSuccess}
        message={authMessage || "Login Successful!"}
        subMessage={authMessage ? authSubMessage : "Redirecting to dashboard..."}
      />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Aurora bands */}
        <div className="auth-aurora top-[10%] left-[-20%] bg-blue-500/15" style={{ animationDelay: '0s' }}></div>
        <div className="auth-aurora bottom-[5%] right-[-20%] bg-cyan-500/12" style={{ animationDelay: '4s' }}></div>
        <div className="auth-aurora top-[50%] left-[10%] bg-indigo-500/10" style={{ animationDelay: '8s', height: '30%' }}></div>

        {/* Original floating orbs — enhanced */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl"></div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}>
        </div>

        {/* Floating geometric shapes */}
        <div className="auth-geo-shape top-20 left-20 w-16 h-16 border border-blue-500/10 rounded-2xl" style={{ animationDelay: '0s', animationDuration: '12s' }}></div>
        <div className="auth-geo-shape top-40 right-32 w-12 h-12 border border-cyan-500/10 rounded-full" style={{ animationDelay: '3s', animationDuration: '14s' }}></div>
        <div className="auth-geo-shape bottom-32 left-32 w-20 h-20 border border-blue-500/10 rounded-3xl" style={{ animationDelay: '6s', animationDuration: '16s' }}></div>
        <div className="auth-geo-shape bottom-20 right-20 w-14 h-14 border border-cyan-500/10 rounded-xl" style={{ animationDelay: '2s', animationDuration: '11s' }}></div>

        {/* Tiny particle dots */}
        <div className="auth-particle w-1.5 h-1.5 bg-blue-400/50 top-[15%] left-[20%]" style={{ animationDelay: '0s' }}></div>
        <div className="auth-particle w-1 h-1 bg-cyan-400/40 top-[60%] right-[15%]" style={{ animationDelay: '2s', animationDuration: '10s' }}></div>
        <div className="auth-particle w-2 h-2 bg-blue-300/30 bottom-[25%] left-[45%]" style={{ animationDelay: '4s', animationDuration: '12s' }}></div>
        <div className="auth-particle w-1 h-1 bg-indigo-400/40 top-[35%] right-[35%]" style={{ animationDelay: '1s', animationDuration: '9s' }}></div>
        <div className="auth-particle w-1.5 h-1.5 bg-cyan-300/35 bottom-[40%] left-[10%]" style={{ animationDelay: '5s', animationDuration: '11s' }}></div>

        {/* Radial spotlight behind card */}
        <div className="auth-spotlight top-1/2 left-1/2 bg-blue-500/8" style={{ filter: 'blur(60px)' }}></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">

        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <img src={logo} alt="AutoValueLK" className="h-12 object-contain mb-6 mx-auto auth-logo-float" />
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to <span className="auth-gradient-text-shimmer">AutoValueLK</span>
          </h1>
          <p className="text-slate-400">
            AI-Powered Vehicle Price Prediction for Sri Lanka
          </p>
        </div>

        {/* Glass Card with glow + accent */}
        <div className="card-glass p-8 auth-card-glow auth-card-accent">
          <form onSubmit={handleLogin} className="space-y-6">

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2 auth-field-enter">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2 auth-field-enter" style={{ animationDelay: '0.1s' }}>
              <label className="label text-center">Email Address</label>
              <div className="relative group auth-input-wrap">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-12 auth-input-glow"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors auth-icon">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2 auth-field-enter" style={{ animationDelay: '0.2s' }}>
              <label className="label text-center">Password</label>
              <div className="relative group auth-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input pl-12 pr-12 auth-input-glow"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors auth-icon">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm auth-field-enter" style={{ animationDelay: '0.3s' }}>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300 transition-colors auth-link-glow">
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <div className="auth-field-enter" style={{ animationDelay: '0.4s' }}>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary auth-btn-neon flex items-center justify-center gap-3 py-4 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6 auth-field-enter" style={{ animationDelay: '0.45s' }}>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-800 text-slate-500">or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="w-full auth-field-enter" style={{ animationDelay: '0.5s' }}>
              <button type="button" onClick={handleGoogleLogin} className="w-full btn-secondary flex items-center justify-center gap-2 py-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Google</span>
              </button>
            </div>

          </form>
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-8 text-slate-400 auth-field-enter" style={{ animationDelay: '0.55s' }}>
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline auth-link-glow">
            Create account
          </Link>
        </p>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2 auth-field-enter" style={{ animationDelay: '0.6s' }}>
          <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secured with 256-bit encryption
          </p>
          <p className="text-slate-600 text-xs">
            © 2026 AutoValueLK. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  )
}

export default Login
