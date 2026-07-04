import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        <div>
          <h3 className="text-2xl font-bold text-primary-light mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm">S</div>
            ShopSphere
          </h3>
          <p className="text-gray-400 mb-6 max-w-sm leading-relaxed">
            Your premium destination for modern shopping. Quality products, fast delivery, and exceptional service.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors duration-300">
              <FaFacebookF />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors duration-300">
              <FaTwitter />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors duration-300">
              <FaInstagram />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors duration-300">
              <FaLinkedinIn />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold mb-6 border-b border-primary w-fit pr-4 pb-2">Shop</h4>
          <ul className="space-y-4">
            <li><Link to="/products" className="text-gray-400 hover:text-white transition-colors">Men's Fashion</Link></li>
            <li><Link to="/products" className="text-gray-400 hover:text-white transition-colors">Women's Fashion</Link></li>
            <li><Link to="/products" className="text-gray-400 hover:text-white transition-colors">Electronics</Link></li>
            <li><Link to="/products" className="text-gray-400 hover:text-white transition-colors">Home & Living</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-bold mb-6 border-b border-primary w-fit pr-4 pb-2">Support</h4>
          <ul className="space-y-4">
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Shipping & Delivery</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Returns & Refunds</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Track Order</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-bold mb-6 border-b border-primary w-fit pr-4 pb-2">Contact Info</h4>
          <ul className="space-y-4 text-gray-400">
            <li className="leading-relaxed">Sector 62, Noida, Uttar Pradesh, India - 201309</li>
            <li>+91 (800) 123-4567</li>
            <li>support@shopsphere.com</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-gray-500 text-sm">© 2026 ShopSphere. All rights reserved.</p>
        <div className="flex gap-4">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 opacity-50 grayscale hover:grayscale-0 transition duration-300" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4 opacity-50 grayscale hover:grayscale-0 transition duration-300" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
