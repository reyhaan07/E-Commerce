import React from "react";
import { Link } from "react-router-dom";

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.name)}`}
      className="group flex flex-col items-center gap-3 rounded-2xl bg-white p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
    >
      <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-brand-100 transition-all duration-300 group-hover:ring-brand-400 sm:h-20 sm:w-20">
        <img
          src={category.image}
          alt={category.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <span className="text-center text-sm font-semibold text-ink group-hover:text-brand-600">
        {category.name}
      </span>
    </Link>
  );
}
