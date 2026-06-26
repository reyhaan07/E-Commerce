import React from 'react';
import { motion } from 'framer-motion';
import { HiArrowRight } from 'react-icons/hi';

const CategoryCard = ({ category }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className="relative h-48 rounded-2xl overflow-hidden group cursor-pointer"
    >
      <img 
        src={category.image} 
        alt={category.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      <div className="absolute bottom-4 left-4 right-4">
        <h3 className="text-white font-bold text-xl mb-1">{category.name}</h3>
        <p className="text-white/80 text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Explore Collection <HiArrowRight />
        </p>
      </div>
    </motion.div>
  );
};

export default CategoryCard;
