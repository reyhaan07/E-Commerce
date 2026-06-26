import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineMail, HiOutlineLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role: 'user',
        }),
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = 'http://localhost:5175';
        return;
      }

      alert(result.message || 'Invalid email or password');
    } catch (error) {
      alert('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-10">
            <Link to="/" className="text-3xl font-bold text-primary flex items-center justify-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">S</div>
                ShopSphere
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
            <p className="text-gray-500 mt-2">Login to your account to continue</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input 
                type="email" 
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              />
            </div>

            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                {showPassword ? <HiEye className="text-xl" /> : <HiEyeOff className="text-xl" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 transition-colors" />
                <span className="text-sm text-gray-600 group-hover:text-primary transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">Forgot Password?</a>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-4 text-lg shadow-lg shadow-primary/20 mt-4 disabled:opacity-70">
              {loading ? 'Signing in...' : 'Login to Account'}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4 text-gray-400">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs font-bold uppercase tracking-widest">Or Continue With</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <button className="w-full mt-6 py-3 px-4 rounded-xl border border-gray-200 flex items-center justify-center gap-3 font-medium hover:bg-gray-50 transition-all active:scale-95">
            <FcGoogle className="text-2xl" /> Login with Google
          </button>

          <p className="mt-8 text-center text-gray-600">
            Don't have an account? <Link to="/register" className="font-bold text-primary hover:text-primary-dark transition-colors underline underline-offset-4">Register Now</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
