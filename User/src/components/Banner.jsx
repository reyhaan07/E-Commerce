import React from 'react';
import { motion } from 'framer-motion';

const Banner = () => {
  return (
    <div className="relative h-[300px] md:h-[500px] w-full overflow-hidden bg-gray-900">
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80" 
          alt="Campaign Hero"
          className="w-full h-full object-cover opacity-60"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex items-center">
        <div className="container mx-auto px-4 md:px-12">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <span className="text-primary-light font-bold tracking-widest uppercase text-sm mb-4 block">Summer Collection 2026</span>
            <h1 className="text-4xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              Upgrade Your <br /> 
              <span className="text-primary">Lifestyle</span> Now
            </h1>
            <p className="text-white/80 text-lg mb-8 max-w-md hidden md:block leading-relaxed">
              Discover our new selection of premium products with exclusive discounts for a limited time.
            </p>
            <div className="flex gap-4">
              <button className="btn-primary flex items-center gap-2 text-lg px-8 py-3">Shop Collection</button>
              <button className="bg-white/10 hover:bg-white/20 text-white font-medium border border-white/30 px-8 py-3 rounded-lg backdrop-blur transition-all">Learn More</button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
