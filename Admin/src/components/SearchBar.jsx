import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

export default function SearchBar({ className = "" }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for products, brands and more"
        className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-5 pr-12 text-sm text-ink placeholder:text-slate-400 shadow-soft transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
        aria-label="Search"
      >
        <FaSearch className="text-xs" />
      </button>
    </form>
  );
}
