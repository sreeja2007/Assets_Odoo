import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import Button from '../components/common/Button';

export default function LoginPage() {
  const { currentUser, login, signup, error, setError } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // login | signup | forgot
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});

  if (currentUser) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const errs = {};
    if (mode === 'signup' && !form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email is required';
    if (mode !== 'forgot' && form.password.length < 1) errs.password = 'Password is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (mode === 'login') {
      const ok = login(form.email, form.password);
      if (ok) navigate('/dashboard');
    } else if (mode === 'signup') {
      signup(form.name, form.email);
      navigate('/dashboard');
    } else {
      // Mock forgot password
      alert(`Password reset link sent to ${form.email}`);
      setMode('login');
    }
  };

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
            <span className="text-white font-bold text-xl">AF</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">AssetFlow</h1>
          <p className="text-sm text-slate-500 mt-1">Enterprise Asset Management</p>
        </div>

        {/* Mode title */}
        <h2 className="text-xl font-medium text-slate-900 mb-6">
          {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
        </h2>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700 flex items-center gap-2">
            <Info size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <Input
              label="Full Name"
              placeholder="Your name"
              value={form.name}
              onChange={set('name')}
              error={formErrors.name}
            />
          )}

          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={set('email')}
            error={formErrors.email}
          />

          {mode !== 'forgot' && (
            <div className="relative">
              <Input
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                error={formErrors.password}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button type="button" onClick={() => setMode('forgot')} className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </button>
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full mt-2">
            {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </Button>
        </form>

        {/* Info box */}
        {mode === 'signup' && (
          <div className="mt-5 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex gap-2">
              <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                New accounts are assigned the <strong>Employee</strong> role by default.
                Contact your Admin to be assigned a higher permission level.
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(''); setFormErrors({}); }} className="text-blue-600 font-medium hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <button onClick={() => { setMode('login'); setError(''); setFormErrors({}); }} className="text-blue-600 font-medium hover:underline">
              Back to sign in
            </button>
          )}
        </p>

        {/* Demo hints */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center mb-2">Demo accounts</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
            {[
              { label: 'Admin', email: 'alex@assetflow.io' },
              { label: 'Asset Mgr', email: 'jordan@assetflow.io' },
              { label: 'Dept Head', email: 'sam@assetflow.io' },
              { label: 'Employee', email: 'taylor@assetflow.io' },
            ].map(d => (
              <button
                key={d.email}
                type="button"
                onClick={() => { setForm({ name:'', email: d.email, password: 'demo' }); setMode('login'); }}
                className="text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span className="font-medium text-slate-700">{d.label}</span><br />
                <span className="text-slate-400">{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
