import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Eye, EyeOff, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
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
      setErrorMsg('Please enter both email/username and password.');
      toast.error('Please enter both email/username and password.');
      return;
    }

    setLoading(true);
    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        toast.success('Welcome back! Successfully signed in.');
        navigate('/dashboard');
      } else {
        setErrorMsg('Access Denied: Invalid credentials. Authorized admin login: user: admin & password: @dmin#123');
        toast.error('Access Denied: Invalid username or password.');
      }
    } catch {
      setErrorMsg('Authentication error. Please verify your credentials.');
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
    <div className="min-h-screen bg-[#ECEEF2] flex items-center justify-center p-3 sm:p-6 selection:bg-indigo-600 selection:text-white font-sans">
      <div className="bg-white rounded-[28px] shadow-2xl shadow-slate-300/60 max-w-4xl w-full p-4 sm:p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        
        {/* Left Side: Car Hero Showcase */}
        <div className="relative rounded-[22px] overflow-hidden h-[260px] sm:h-[380px] md:h-[560px] w-full bg-slate-950 shadow-inner group">
          <img
            src="/assets/images/login-car.jpg"
            alt="Sri Munis Kanna & DrivePro Luxury Yellow Sports Car"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white text-xs">
            <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md font-semibold border border-white/20 tracking-wider">
              SMK ERP PORTAL
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-950 font-bold text-[10px]">
              2026 EDITION
            </span>
          </div>

          <div className="absolute bottom-5 left-5 right-5 text-white">
            <h3 className="text-lg sm:text-xl font-black tracking-tight drop-shadow-md">
              Sri Munis Kanna Driving School
            </h3>
            <p className="text-xs text-white/80 mt-0.5 drop-shadow-sm">
              Complete ERP, CRM, Fleet Management &amp; Car Rentals
            </p>
          </div>
        </div>

        {/* Right Side: Sign In Form */}
        <div className="p-2 sm:p-4 md:p-6 flex flex-col justify-center">
          {/* Logo Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center gap-2 text-indigo-600 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <Car className="w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                DrivePro <span className="text-indigo-600">SMK</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Sign In to your account
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter your details to proceed further
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-start gap-2 animate-shake">
              <span className="font-bold shrink-0">Alert:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Admin Helper Badge */}
          <div className="mb-4 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-indigo-950">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Admin: <strong className="text-indigo-700">admin</strong> / <strong className="text-indigo-700">@dmin#123</strong></span>
            </div>
            <button
              type="button"
              onClick={fillAdmin}
              className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Fill
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email / Username Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email or Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-all pr-10"
                  placeholder="admin or email@domain.com"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Your password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-all pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Recover Password */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="font-medium">Remember me</span>
              </label>
              <button
                type="button"
                onClick={fillAdmin}
                className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer"
              >
                Recover Password
              </button>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold tracking-wide shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-70 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">Or</span>
            </div>
          </div>

          {/* Social / Staff Sign-In List */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={fillAdmin}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2.5 text-xs text-slate-700 font-medium group cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign In with Google</span>
            </button>

            <button
              type="button"
              onClick={fillAdmin}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2.5 text-xs text-slate-700 font-medium group cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#1877F2] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Sign In with Facebook</span>
            </button>
          </div>

          <div className="mt-5 text-center">
            <a href="/" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors">
              &larr; Return to Sri Munis Kanna Website
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

