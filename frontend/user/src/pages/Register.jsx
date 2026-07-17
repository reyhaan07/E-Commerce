import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlinePhone } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { apiRequest } from '../api/client';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      setNotice(data.message || 'We emailed you a 6-digit code');
      setOtpStep(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await apiRequest('/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, otp }),
      });
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendOtp() {
    setError('');
    try {
      const data = await apiRequest('/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email: form.email }),
      });
      setNotice(data.message || 'A new code has been sent');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden my-8"
      >
        <div className="p-8">
          <div className="text-center mb-10">
            <Link to="/" className="text-3xl font-bold text-primary flex items-center justify-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">B</div>
                BlueCart
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">{otpStep ? 'Verify Your Email' : 'Create Account'}</h2>
            <p className="text-gray-500 mt-2">
              {otpStep ? `Enter the 6-digit code we sent to ${form.email}` : 'Join us for a better shopping experience'}
            </p>
          </div>

          {otpStep ? (
            <form className="space-y-5" onSubmit={handleVerifyOtp}>
              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}
              {notice && !error && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">{notice}</p>
              )}

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
              />

              <button type="submit" disabled={submitting || otp.length !== 6} className="w-full btn-primary py-4 text-lg shadow-lg shadow-primary/20 disabled:opacity-60">
                {submitting ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Didn't get the code?{' '}
                <button type="button" onClick={handleResendOtp} className="text-primary font-semibold hover:underline">
                  Resend
                </button>
                {' '}(when SMTP isn't configured, the code is printed in the backend console)
              </p>
            </form>
          ) : (
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
                placeholder="Mobile Number"
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
                placeholder="Password"
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

            <p className="text-xs text-gray-500 leading-relaxed">
              By registering, you agree to our <a href="#" className="text-primary hover:underline">Terms of Use</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
            </p>

            <button type="submit" disabled={submitting} className="w-full btn-primary py-4 text-lg shadow-lg shadow-primary/20 mt-4 disabled:opacity-60">
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          )}

          <p className="mt-8 text-center text-gray-600">
            Already have an account? <a href="http://localhost:5177?role=user" className="font-bold text-primary hover:text-primary-dark transition-colors underline underline-offset-4">Sign In</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
