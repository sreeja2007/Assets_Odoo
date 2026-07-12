import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Info, Monitor, Cpu, Wrench, BarChart2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

// Isometric Hexagonal Logo Icon
function HexLogo() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12 flex-shrink-0">
      <defs>
        <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path
        d="M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z"
        fill="url(#hexGrad)"
        className="drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
      />
      <path
        d="M50 20 L80 37 L80 63 L50 80 L20 63 L20 37 Z"
        fill="rgba(255, 255, 255, 0.15)"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { currentUser, login, signup, error, setError } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);

  if (currentUser) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    if (mode === 'login') {
      const ok = await login(form.email, form.password);
      if (ok) navigate('/dashboard');
    } else {
      signup(form.name, form.email);
      navigate('/dashboard');
    }
  };

  const handleSocialClick = (platform) => {
    alert(`Connecting to ${platform} placeholder SSO...`);
  };

  return (
    <div className="min-h-screen bg-[#030712] flex relative overflow-hidden font-sans">
      
      {/* Background glowing decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Grid Wrapper */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 md:p-12 relative z-10">
        
        {/* Left Column: Branding / Graphic Illustrations (6 cols) */}
        <div className="lg:col-span-7 space-y-10 pr-0 lg:pr-8">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3.5">
            <HexLogo />
            <div>
              <p className="font-extrabold text-white text-xl tracking-wide leading-none">AssetFlow</p>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Enterprise Asset Management</p>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
              Manage. Track. <br className="hidden md:inline"/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
                Optimize.
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-lg leading-relaxed">
              A complete solution to streamline your assets, resources, and operations in one intelligent platform.
            </p>
          </div>

          {/* Feature Bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                <Monitor size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Smart Asset Tracking</p>
                <p className="text-xs text-slate-400 mt-1">Real-time visibility and tracking</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                <Cpu size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Resource Scheduling</p>
                <p className="text-xs text-slate-400 mt-1">Efficient allocation and booking</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                <Wrench size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Maintenance Management</p>
                <p className="text-xs text-slate-400 mt-1">Preventive maintenance and alerts</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                <BarChart2 size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Advanced Analytics</p>
                <p className="text-xs text-slate-400 mt-1">Data-driven insights and reports</p>
              </div>
            </div>
          </div>

          {/* Mock Graphic Visual Illustration of Isometric Devices & Stats widgets */}
          <div className="relative border border-slate-800/80 bg-slate-950/20 rounded-[32px] p-8 overflow-hidden h-64 hidden sm:flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/10 to-transparent pointer-events-none" />
            <div className="absolute top-4 left-6 bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl w-40 animate-pulse">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total Assets</span>
              <p className="text-lg font-extrabold text-white mt-1">1,248</p>
              <span className="text-[10px] text-emerald-400 font-bold mt-1 inline-block">▲ +12.5%</span>
            </div>
            
            <div className="absolute bottom-6 right-6 bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl w-36">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Active Bookings</span>
              <p className="text-lg font-extrabold text-white mt-1">32</p>
            </div>

            {/* Center Laptop mockup outline */}
            <div className="w-48 h-32 bg-slate-900 border-2 border-slate-800 rounded-t-2xl relative shadow-2xl flex items-center justify-center">
              <div className="w-[88%] h-[80%] bg-blue-950/50 border border-blue-900/30 rounded flex items-center justify-center">
                <HexLogo />
              </div>
              {/* Laptop bottom bar */}
              <div className="absolute bottom-[-10px] w-56 h-2 bg-slate-800 rounded-b-xl" />
            </div>
          </div>

        </div>

        {/* Right Column: Glassmorphism Login Card (5 cols) */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-[32px] p-10 shadow-2xl shadow-black/40 relative">
            
            <div className="flex flex-col items-center text-center mb-8">
              <HexLogo />
              <h2 className="text-xl font-extrabold text-white mt-4">AssetFlow</h2>
              <p className="text-xs text-slate-400 mt-1.5">Welcome back! Please sign in to continue</p>
            </div>

            {error && (
              <div className="mb-4 px-4.5 py-3 rounded-2xl bg-red-950/40 border border-red-500/20 text-xs font-semibold text-red-400 flex items-center gap-2">
                <Info size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl py-3 px-4.5 text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                    value={form.name}
                    onChange={(e) => { setForm(prev => ({ ...prev, name: e.target.value })); setError(''); }}
                    required
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 bg-slate-950/40 border border-slate-800 rounded-2xl py-3.5 text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                    value={form.email}
                    onChange={(e) => { setForm(prev => ({ ...prev, email: e.target.value })); setError(''); }}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-4 text-slate-500 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 bg-slate-950/40 border border-slate-800 rounded-2xl py-3.5 text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                    value={form.password}
                    onChange={(e) => { setForm(prev => ({ ...prev, password: e.target.value })); setError(''); }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 text-slate-500 hover:text-slate-300 flex items-center"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs font-semibold mt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-400 normal-case font-semibold">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('SSO integration allows resetting via workspace directory.')}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Action */}
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-indigo-500/20 hover:opacity-95 mt-4 transition-all">
                {mode === 'login' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>

            {/* SSO Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
              <span className="relative bg-[#0b101c] px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">or continue with</span>
            </div>

            {/* SSO Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSocialClick('Google')}
                className="bg-slate-950/40 border border-slate-800 hover:bg-slate-900/60 rounded-2xl py-3 px-4 flex items-center justify-center gap-2.5 text-xs font-bold text-slate-300 transition-colors"
              >
                {/* Google Icon */}
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.522 5.522 0 0 1 8.4 13a5.522 5.522 0 0 1 5.59-5.514c2.258 0 4.114 1.257 5.067 3.085l3.6-2.77C20.65 4.3 17.58 2.5 13.99 2.5 8.2 2.5 3.5 7.2 3.5 13s4.7 10.5 10.49 10.5c6.04 0 10.03-4.24 10.03-10.2 0-.68-.06-1.34-.17-2.015H12.24z" />
                </svg>
                Google
              </button>
              
              <button
                onClick={() => handleSocialClick('Microsoft')}
                className="bg-slate-950/40 border border-slate-800 hover:bg-slate-900/60 rounded-2xl py-3 px-4 flex items-center justify-center gap-2.5 text-xs font-bold text-slate-300 transition-colors"
              >
                {/* Microsoft Icon */}
                <svg viewBox="0 0 23 23" className="w-4 h-4">
                  <path fill="#F25022" d="M0 0h11v11H0z" />
                  <path fill="#7FBA00" d="M12 0h11v11H12z" />
                  <path fill="#01A6F0" d="M0 12h11v11H0z" />
                  <path fill="#FFB900" d="M12 12h11v11H12z" />
                </svg>
                Microsoft
              </button>
            </div>

            {/* Toggle Mode */}
            <div className="mt-8 text-center text-xs font-semibold text-slate-400">
              {mode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button onClick={() => setMode('signup')} className="text-indigo-400 hover:text-indigo-300 transition-colors">Sign up</button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="text-indigo-400 hover:text-indigo-300 transition-colors">Sign in</button>
                </p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
