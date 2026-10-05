import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import { HiEye, HiEyeSlash } from 'react-icons/hi2';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const API_BASE = 'http://localhost:5000/api';
const FALLBACK_API_BASE = 'http://127.0.0.1:5000/api';

async function apiFetch(endpoint, options) {
  try {
    return await fetch(`${API_BASE}${endpoint}`, options);
  } catch {
    return await fetch(`${FALLBACK_API_BASE}${endpoint}`, options);
  }
}

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(null);

  const redirectUrl = searchParams.get('redirect') || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBlocked(null);
    setLoading(true);

    try {
      const response = await apiFetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: 'user',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result.accountStatus) {
          setBlocked({ status: result.accountStatus, message: result.message });
          setLoading(false);
          return;
        }
        throw new Error(result.message || 'Invalid email or password');
      }

      login({
        id: result.id,
        name: result.name,
        email: result.email || email.trim(),
        token: result.token,
      });

      // Navigate safely
      if (redirectUrl.startsWith('/')) {
        navigate(redirectUrl, { replace: true });
      } else {
        try {
          const parsed = new URL(redirectUrl);
          if (parsed.origin === window.location.origin) {
            navigate(parsed.pathname + parsed.search, { replace: true });
          } else {
            window.location.href = redirectUrl;
          }
        } catch {
          navigate('/', { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden my-8"
      >
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="text-3xl font-black text-primary flex items-center justify-center gap-2.5 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
                S
              </div>
              <span className="text-slate-900 tracking-tight font-black">ShopSphere</span>
            </Link>
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your account to continue shopping</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Account Status / Blocked Banner */}
          {blocked && (
            <div className="mb-5 overflow-hidden rounded-xl border border-rose-200 bg-white">
              <div className="bg-rose-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
                {blocked.status === 'suspended' ? 'Account Suspended' : 'Account Deactivated'}
              </div>
              <div className="px-4 py-3 text-sm text-slate-600">
                <p>{blocked.message}</p>
                <p className="mt-1.5 text-xs text-slate-400">
                  Contact an administrator or support to request account reinstatement.
                </p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-900 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Password
                </label>
                <a
                  href="http://localhost:5177/?token="
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-900 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <HiEyeSlash className="text-lg" /> : <HiEye className="text-lg" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-base font-bold shadow-lg shadow-primary/20 mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-primary hover:text-primary-dark transition-colors underline underline-offset-4"
            >
              Create Account
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 mb-2">
              Are you an Admin, Seller, or Delivery Partner?
            </p>
            <a
              href="http://localhost:5177"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              Switch Portal Login →
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
