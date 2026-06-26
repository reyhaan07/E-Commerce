import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaCcVisa,
  FaCcMastercard,
  FaCcPaypal,
} from "react-icons/fa";

const columns = [
  {
    title: "About",
    links: ["Contact Us", "About ShopSphere", "Careers", "Press Releases"],
  },
  {
    title: "Help",
    links: ["Payments", "Shipping", "Cancellation & Returns", "FAQ"],
  },
  {
    title: "Policy",
    links: ["Return Policy", "Terms of Use", "Privacy Policy", "Security"],
  },
  {
    title: "Social",
    links: ["Facebook", "Instagram", "Twitter", "YouTube"],
  },
];

export default function Footer() {
  return (
    <footer className="mt-12 bg-brand-800 text-brand-100 pb-20 sm:pb-0">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:grid-cols-4">
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">
              {col.title}
            </h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-brand-200 transition-colors hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-brand-700">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-accent to-brand-400 text-sm font-bold text-white">
              S
            </div>
            <span className="font-display text-lg font-bold text-white">ShopSphere</span>
          </div>

          <div className="flex gap-4 text-lg">
            <a href="#" aria-label="Facebook" className="transition-colors hover:text-white"><FaFacebookF /></a>
            <a href="#" aria-label="Twitter" className="transition-colors hover:text-white"><FaTwitter /></a>
            <a href="#" aria-label="Instagram" className="transition-colors hover:text-white"><FaInstagram /></a>
            <a href="#" aria-label="YouTube" className="transition-colors hover:text-white"><FaYoutube /></a>
          </div>

          <div className="flex gap-3 text-2xl text-brand-200">
            <FaCcVisa />
            <FaCcMastercard />
            <FaCcPaypal />
          </div>
        </div>
      </div>

      <p className="pb-6 text-center text-xs text-brand-300">
        © 2026 ShopSphere. All rights reserved.
      </p>
    </footer>
  );
}
