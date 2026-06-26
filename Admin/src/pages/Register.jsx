import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-br from-brand-50 via-white to-sky-50 px-4 py-12">
      <div className="w-full max-w-md animate-slide-up rounded-3xl border border-white/50 bg-white/70 p-8 shadow-glass backdrop-blur-xl sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-sky-accent text-xl font-bold text-white shadow-soft">
            S
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Join ShopSphere and start shopping</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Full Name</label>
            <div className="relative">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Aarav Sharma" className="input-field pl-11" required />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Email Address</label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" placeholder="you@example.com" className="input-field pl-11" required />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Mobile Number</label>
            <div className="relative">
              <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="tel" placeholder="+91 98765 43210" className="input-field pl-11" required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
                  className="input-field pl-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Confirm Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  className="input-field pl-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-500">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" required />
            I agree to the Terms of Service and Privacy Policy
          </label>

          <button type="submit" className="btn-primary mt-1 w-full">
            Create Account
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
