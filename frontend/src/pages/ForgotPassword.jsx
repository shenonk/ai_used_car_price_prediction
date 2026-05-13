import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { resetPassword } from "../utils/auth"

function ForgotPassword() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1) // 1 = email, 2 = success
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleEmailSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        const result = await resetPassword(email)
        setIsLoading(false)

        if (result.success) {
            setStep(2)
        } else {
            setError(result.error)
        }
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden auth-scanlines">

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Aurora bands — purple palette */}
                <div className="auth-aurora top-[10%] left-[-20%] bg-purple-500/15" style={{ animationDelay: '0s' }}></div>
                <div className="auth-aurora bottom-[5%] right-[-20%] bg-indigo-500/12" style={{ animationDelay: '4s' }}></div>
                <div className="auth-aurora top-[50%] left-[10%] bg-violet-500/10" style={{ animationDelay: '8s', height: '30%' }}></div>

                {/* Floating orbs */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl"></div>

                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}>
                </div>

                {/* Floating geometric shapes */}
                <div className="auth-geo-shape top-20 left-20 w-16 h-16 border border-purple-500/10 rounded-2xl" style={{ animationDelay: '0s', animationDuration: '14s' }}></div>
                <div className="auth-geo-shape top-40 right-32 w-12 h-12 border border-indigo-500/10 rounded-full" style={{ animationDelay: '3s', animationDuration: '12s' }}></div>
                <div className="auth-geo-shape bottom-32 left-32 w-20 h-20 border border-violet-500/10 rounded-3xl" style={{ animationDelay: '6s', animationDuration: '16s' }}></div>
                <div className="auth-geo-shape bottom-20 right-20 w-14 h-14 border border-purple-500/10 rounded-xl" style={{ animationDelay: '2s', animationDuration: '11s' }}></div>

                {/* Tiny particle dots */}
                <div className="auth-particle w-1.5 h-1.5 bg-purple-400/50 top-[15%] left-[20%]" style={{ animationDelay: '0s' }}></div>
                <div className="auth-particle w-1 h-1 bg-indigo-400/40 top-[60%] right-[15%]" style={{ animationDelay: '2s', animationDuration: '10s' }}></div>
                <div className="auth-particle w-2 h-2 bg-violet-300/30 bottom-[25%] left-[45%]" style={{ animationDelay: '4s', animationDuration: '12s' }}></div>
                <div className="auth-particle w-1 h-1 bg-purple-400/40 top-[35%] right-[35%]" style={{ animationDelay: '1s', animationDuration: '9s' }}></div>
                <div className="auth-particle w-1.5 h-1.5 bg-indigo-300/35 bottom-[40%] left-[10%]" style={{ animationDelay: '5s', animationDuration: '11s' }}></div>

                {/* Radial spotlight */}
                <div className="auth-spotlight top-1/2 left-1/2 bg-purple-500/8" style={{ filter: 'blur(60px)' }}></div>
            </div>

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-md animate-fade-in">

                {/* Logo & Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 mb-6 shadow-lg shadow-purple-500/30 auth-logo-float">
                        {step === 2 ? (
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        ) : (
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {step === 1 && <>Reset Your <span className="auth-gradient-text-shimmer">Password</span></>}
                        {step === 2 && <><span className="auth-gradient-text-shimmer">Check Your</span> Email</>}
                    </h1>
                    <p className="text-slate-400">
                        {step === 1 && "Enter your email address to receive a password reset link"}
                        {step === 2 && "We've sent a secure password reset link to your email."}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    {[1, 2].map((s) => (
                        <div key={s} className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${step >= s
                                    ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                                }`}>
                                {step > s ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : s}
                            </div>
                            {s < 2 && (
                                <div className={`w-12 h-0.5 transition-all duration-500 ${step > s ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-slate-700'
                                    }`}></div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Glass Card */}
                <div className="card-glass p-8 auth-card-glow-purple auth-card-accent auth-card-accent-purple">

                    {/* Step 1: Email Input */}
                    {step === 1 && (
                        <form onSubmit={handleEmailSubmit} className="space-y-6">

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
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors auth-icon">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm flex items-start gap-2 auth-field-enter" style={{ animationDelay: '0.2s' }}>
                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                We'll verify your email and send you a password reset link.
                            </div>

                            {/* Submit Button */}
                            <div className="auth-field-enter" style={{ animationDelay: '0.3s' }}>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full btn-primary auth-btn-neon-purple flex items-center justify-center gap-3 py-4 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Send Reset Link</span>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 2: Success Sent */}
                    {step === 2 && (
                        <div className="text-center space-y-6 auth-field-enter">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-2" style={{ boxShadow: '0 0 30px rgba(16, 185, 129, 0.15), 0 0 60px rgba(16, 185, 129, 0.05)' }}>
                                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">Check Your Inbox</h3>
                                <p className="text-slate-400 text-sm">
                                    We've sent a password recovery link to your email address. Click the link to reset your password.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate("/login")}
                                className="w-full btn-primary auth-btn-neon-purple flex items-center justify-center gap-3 py-4 text-lg"
                            >
                                <span>Go to Sign In</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Back to Login Link */}
                {step === 1 && (
                    <p className="text-center mt-8 text-slate-400 auth-field-enter" style={{ animationDelay: '0.4s' }}>
                        Remember your password?{" "}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline auth-link-glow">
                            Sign in
                        </Link>
                    </p>
                )}

                {/* Footer */}
                <div className="text-center mt-6 space-y-2 auth-field-enter" style={{ animationDelay: '0.45s' }}>
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

export default ForgotPassword
