import React, { useState, useEffect, useCallback } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { banners } from "../data/dummyData";

export default function Banner() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % banners.length), []);
  const prev = () => setIndex((i) => (i - 1 + banners.length) % banners.length);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-card">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className={`relative flex min-w-full items-center overflow-hidden bg-gradient-to-r ${banner.bg} px-6 py-10 sm:px-12 sm:py-16`}
          >
            <div className="z-10 max-w-md animate-slide-up text-white">
              <h2 className="font-display text-2xl font-extrabold leading-tight sm:text-4xl">
                {banner.title}
              </h2>
              <p className="mt-2 text-sm text-brand-100 sm:text-base">{banner.subtitle}</p>
              <button className="mt-5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-700 shadow-lift transition-transform hover:scale-105">
                {banner.cta}
              </button>
            </div>
            <img
              src={banner.image}
              alt={banner.title}
              className="absolute right-0 top-0 hidden h-full w-1/2 object-cover opacity-90 sm:block"
              style={{ maskImage: "linear-gradient(to right, transparent, black 30%)" }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={prev}
        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-brand-700 shadow-soft backdrop-blur transition-all hover:bg-white"
        aria-label="Previous slide"
      >
        <FaChevronLeft />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-brand-700 shadow-soft backdrop-blur transition-all hover:bg-white"
        aria-label="Next slide"
      >
        <FaChevronRight />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {banners.map((b, i) => (
          <button
            key={b.id}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-2 bg-white/50"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
