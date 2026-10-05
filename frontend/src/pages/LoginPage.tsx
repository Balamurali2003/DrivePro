import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
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
    if (!username.trim() || !password) {
      setErrorMsg('Please enter both username and password.');
      toast.error('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const ok = await login(username.trim(), password);
      if (ok) {
        toast.success('Welcome back to SMK Admin Portal!');
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
    setUsername('admin');
    setPassword('@dmin#123');
    setErrorMsg('');
    toast.info('Admin credentials auto-filled (admin / @dmin#123)');
  };

  return (
    <div className="min-h-screen bg-[#ECEEF2] flex items-center justify-center p-3 sm:p-6 selection:bg-[#4F46E5] selection:text-white font-sans antialiased">
      {/* Main White Box Card */}
      <div className="bg-white rounded-[28px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] max-w-[880px] w-full p-4 sm:p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
        
        {/* Left: Car Showcase Image Box */}
        <div className="relative rounded-[20px] overflow-hidden h-[240px] sm:h-[340px] md:h-[500px] w-full bg-slate-100 shadow-sm">
          <img
            src="/assets/images/login-car.jpg"
            alt="SMK Driving School Yellow Sports Car"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Right: Sign In Form Box */}
        <div className="flex flex-col justify-center px-1 sm:px-4 md:px-5 py-2">
          
          {/* SMK Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center gap-2.5 mb-2.5">
              {/* SMK Stylized Logo */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FBBF24] via-[#F59E0B] to-[#D97706] flex items-center justify-center text-slate-950 font-black tracking-tight text-sm shadow-md shadow-amber-200">
                SMK
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
                SMK <span className="text-[#4F46E5]">Driving School</span>
              </span>
            </div>
            
            <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">
              Login into admin portal
            </h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Enter your username and password to proceed
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
            
            {/* Username Field */}
            <div>
              <label className="block text-xs text-[#64748B] font-medium mb-1.5">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder:text-[#CBD5E1] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] focus:outline-none transition-colors pr-9 shadow-sm"
                  placeholder="admin"
                />
                <User className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs text-[#64748B] font-medium mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder:text-[#CBD5E1] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] focus:outline-none transition-colors pr-9 shadow-sm tracking-wider"
                  placeholder="••••••••"
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
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-[#64748B]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#4F46E5] focus:ring-[#4F46E5] border-[#CBD5E1]"
                />
                <span className="text-xs">Remember me</span>
              </label>
              <button
                type="button"
                onClick={fillAdmin}
                className="text-xs text-[#4F46E5] hover:underline font-medium cursor-pointer"
              >
                Recover Password
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 transition-all flex items-center justify-center cursor-pointer disabled:opacity-70 mt-2"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Quick Helper Badge */}
          <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-[#64748B]">
            <span>Admin: <strong className="text-[#0F172A]">admin</strong> / <strong className="text-[#0F172A]">@dmin#123</strong></span>
            <button
              type="button"
              onClick={fillAdmin}
              className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#4F46E5] text-white hover:bg-[#4338CA] transition-colors cursor-pointer"
            >
              Auto-Fill
            </button>
          </div>

          <div className="mt-5 text-center">
            <a href="/" className="text-xs text-[#94A3B8] hover:text-[#4F46E5] transition-colors">
              &larr; Back to website
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
