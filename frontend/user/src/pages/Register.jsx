import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlinePhone } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { apiRequest } from '../api/client';

const LOGIN_URL = '/login';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(3);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Only permit numeric digits, max 10
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setForm((prev) => ({ ...prev, phone: digitsOnly }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Strict 10-digit numeric phone validation
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });

      // Flow requirement: DO NOT auto-login. Show success, then manual login.
      setSuccess(true);
      let count = 3;
      const interval = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          navigate(LOGIN_URL);
        }
      }, 1000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-8"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <Link to="/" className="text-3xl font-black text-primary flex items-center justify-center gap-2.5 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">S</div>
              <span className="text-slate-900 tracking-tight font-black">ShopSphere</span>
            </Link>
            <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
            <p className="text-slate-500 mt-1 text-sm">Join us for a better shopping experience</p>
          </div>

          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                ✓
              </div>
              <h3 className="text-xl font-bold text-slate-900">Account Created Successfully!</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Your account is ready. Please sign in with your email and password to continue.
              </p>
              <div className="pt-2">
                <Link
                  to={LOGIN_URL}
                  className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-base font-semibold shadow-lg shadow-primary/20"
                >
                  Proceed to Sign In ({countdown}s)
                </Link>
              </div>
            </div>
          ) : (
            <>
              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
                )}

                <div className="relative">
                  <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="relative">
                  <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="relative">
                  <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                  <input
                    type="tel"
                    name="phone"
                    maxLength={10}
                    placeholder="10-Digit Mobile Number"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password (min 8 chars)"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button type="submit" disabled={submitting} className="w-full btn-primary py-4 text-lg shadow-lg shadow-primary/20 mt-4 disabled:opacity-60">
                  {submitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <p className="mt-8 text-center text-gray-600">
                Already have an account? <Link to="/login" className="font-bold text-primary hover:text-primary-dark transition-colors underline underline-offset-4">Sign In</Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
