import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        toast.success('Welcome back! Successfully signed in.');
        navigate('/dashboard');
      } else {
        setErrorMsg('Access Denied: Invalid credentials. Admin credentials: user: admin & password: @dmin#123');
        toast.error('Invalid username or password.');
      }
    } catch {
      setErrorMsg('Authentication service error.');
      toast.error('Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    setEmail('admin');
    setPassword('@dmin#123');
    setErrorMsg('');
    toast.info('Admin credentials auto-filled.');
  };

  return (
    <div className="min-h-screen bg-[#ECEEF2] flex items-center justify-center p-3 sm:p-6 selection:bg-indigo-600 selection:text-white font-sans antialiased">
      {/* Main White Box Card */}
      <div className="bg-white rounded-[28px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] max-w-[880px] w-full p-4 sm:p-6 md:p-7 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
        
        {/* Left: Car Showcase Image Box */}
        <div className="relative rounded-[20px] overflow-hidden h-[240px] sm:h-[340px] md:h-[530px] w-full bg-slate-100 shadow-sm">
          <img
            src="/assets/images/login-car.jpg"
            alt="Yellow Sports Car on Highway"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Right: Sign In Form Box */}
        <div className="flex flex-col justify-center px-1 sm:px-4 md:px-5 py-2">
          
          {/* Logo Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              {/* CarWay Blue Car Icon */}
              <svg className="w-8 h-8 text-[#4F46E5]" viewBox="0 0 32 32" fill="currentColor">
                <path d="M26.5 12h-2.17l-2.42-4.84A3 3 0 0 0 19.22 5.5H10.78a3 3 0 0 0-2.69 1.66L5.67 12H3.5A2.5 2.5 0 0 0 1 14.5v6A2.5 2.5 0 0 0 3.5 23H4a4 4 0 0 0 8 0h8a4 4 0 0 0 8 0h1.5a2.5 2.5 0 0 0 2.5-2.5v-6a2.5 2.5 0 0 0-2.5-2.5zm-16.11-4.66a1 1 0 0 1 .89-.55h8.44a1 1 0 0 1 .9.55L22.25 12H7.75l2.64-4.66zM8 24a2 2 0 1 1 2-2 2 2 0 0 1-2 2zm16 0a2 2 0 1 1 2-2 2 2 0 0 1-2 2zm5-3.5a.5.5 0 0 1-.5.5H27a3.98 3.98 0 0 0-6 0h-10a3.98 3.98 0 0 0-6 0H3.5a.5.5 0 0 1-.5-.5v-6a.5.5 0 0 1 .5-.5h25a.5.5 0 0 1 .5.5z"/>
              </svg>
              <span className="text-xl font-extrabold tracking-tight text-[#1E293B]">
                Car<span className="text-[#4F46E5]">Way</span>
              </span>
            </div>
            <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">
              Sign In to your account
            </h1>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">
              Enter your details to proceed further
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-[11px] text-[#94A3B8] font-normal mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder:text-[#CBD5E1] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] focus:outline-none transition-colors pr-9 shadow-sm"
                  placeholder="dobria.holt@example.com"
                />
                <Mail className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] text-[#94A3B8] font-normal mb-1">
                Your password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder:text-[#CBD5E1] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] focus:outline-none transition-colors pr-9 shadow-sm tracking-wider"
                  placeholder="wertyp1234"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Recover Password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-[#64748B]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#4F46E5] focus:ring-[#4F46E5] border-[#CBD5E1]"
                />
                <span className="text-[11px]">Remember me</span>
              </label>
              <button
                type="button"
                onClick={fillAdmin}
                className="text-[11px] text-[#4F46E5] hover:underline font-medium cursor-pointer"
              >
                Recover Password
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition-all flex items-center justify-center cursor-pointer disabled:opacity-70 mt-1"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 text-center">
            <span className="text-[11px] text-[#94A3B8]">Or</span>
          </div>

          {/* Social / SSO Links Matching Mockup */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={fillAdmin}
              className="w-full py-1.5 px-3 flex items-center justify-center gap-2 text-xs text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span className="text-[11px]">Sign Up with Google</span>
            </button>

            <button
              type="button"
              onClick={fillAdmin}
              className="w-full py-1.5 px-3 flex items-center justify-center gap-2 text-xs text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-[#1877F2] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-[11px]">Sign Up with Google</span>
            </button>

            <button
              type="button"
              onClick={fillAdmin}
              className="w-full py-1.5 px-3 flex items-center justify-center gap-2 text-xs text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-[#1DA1F2] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z"/>
              </svg>
              <span className="text-[11px]">Sign Up with Google</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <a href="/" className="text-[11px] text-[#94A3B8] hover:text-[#4F46E5] transition-colors">
              &larr; Back to website
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};


