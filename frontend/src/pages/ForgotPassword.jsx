import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { resetPassword } from "../utils/auth"

function ForgotPassword() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1) // 1 = email, 2 = new password, 3 = success
    const [email, setEmail] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const handleEmailSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Check if email exists in localStorage
        const users = JSON.parse(localStorage.getItem('carpriceai_users') || '[]')
        const userExists = users.find(u => u.email.toLowerCase() === email.toLowerCase())
        setIsLoading(false)

        if (!userExists) {
            setError("No account found with this email address.")
            return
        }
        setStep(2)
    }

    const handlePasswordReset = async (e) => {
        e.preventDefault()
        setError("")

        if (newPassword.length < 4) {
            setError("Password must be at least 4 characters.")
            return
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1000))

        const result = await resetPassword(email, newPassword)
        setIsLoading(false)

        if (result.success) {
            setStep(3)
        } else {
            setError(result.error)
        }
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl"></div>
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}>
                </div>
                <div className="absolute top-20 left-20 w-16 h-16 border border-purple-500/10 rounded-2xl rotate-12 animate-float" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-40 right-32 w-12 h-12 border border-blue-500/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-32 left-32 w-20 h-20 border border-indigo-500/10 rounded-3xl -rotate-12 animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-20 right-20 w-14 h-14 border border-purple-500/10 rounded-xl rotate-45 animate-float" style={{ animationDelay: '0.8s' }}></div>
            </div>

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-md animate-fade-in">

                {/* Logo & Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 mb-6 shadow-lg shadow-purple-500/30 animate-pulse-glow">
                        {step === 3 ? (
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {step === 1 && <>Reset Your <span className="gradient-text">Password</span></>}
                        {step === 2 && <>Create New <span className="gradient-text">Password</span></>}
                        {step === 3 && <><span className="gradient-text">Password Reset</span> Complete</>}
                    </h1>
                    <p className="text-slate-400">
                        {step === 1 && "Enter your email address to reset your password"}
                        {step === 2 && "Choose a strong password for your account"}
                        {step === 3 && "Your password has been successfully updated"}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    {[1, 2, 3].map((s) => (
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
                            {s < 3 && (
                                <div className={`w-12 h-0.5 transition-all duration-500 ${step > s ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-slate-700'
                                    }`}></div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Glass Card */}
                <div className="card-glass p-8">

                    {/* Step 1: Email Input */}
                    {step === 1 && (
                        <form onSubmit={handleEmailSubmit} className="space-y-6">

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="label text-center">Email Address</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="input pl-12"
                                        required
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm flex items-start gap-2">
                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                We'll verify your email and let you create a new password.
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary flex items-center justify-center gap-3 py-4 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Continue</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Step 2: New Password */}
                    {step === 2 && (
                        <form onSubmit={handlePasswordReset} className="space-y-6">

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Email Display */}
                            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm flex items-center gap-2">
                                <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                                Resetting password for <span className="text-white font-medium ml-1">{email}</span>
                            </div>

                            {/* New Password Field */}
                            <div className="space-y-2">
                                <label className="label text-center">New Password</label>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Create a new password"
                                        className="input pl-12 pr-12"
                                        required
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
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

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <label className="label text-center">Confirm New Password</label>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your new password"
                                        className="input pl-12"
                                        required
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Password Requirements */}
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Password Requirements</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className={`flex items-center gap-2 text-xs ${newPassword.length >= 4 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={newPassword.length >= 4 ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                                        </svg>
                                        Min. 4 characters
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs ${newPassword === confirmPassword && confirmPassword.length > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={newPassword === confirmPassword && confirmPassword.length > 0 ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                                        </svg>
                                        Passwords match
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary flex items-center justify-center gap-3 py-4 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Resetting password...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Reset Password</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </>
                                )}
                            </button>

                            {/* Back Button */}
                            <button
                                type="button"
                                onClick={() => { setStep(1); setError("") }}
                                className="w-full text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 py-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to email
                            </button>
                        </form>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && (
                        <div className="text-center space-y-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-2">
                                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">All Done!</h3>
                                <p className="text-slate-400 text-sm">
                                    Your password has been successfully reset. You can now sign in with your new password.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate("/login")}
                                className="w-full btn-primary flex items-center justify-center gap-3 py-4 text-lg"
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
                {step !== 3 && (
                    <p className="text-center mt-8 text-slate-400">
                        Remember your password?{" "}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline">
                            Sign in
                        </Link>
                    </p>
                )}

                {/* Footer */}
                <div className="text-center mt-6 space-y-2">
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
