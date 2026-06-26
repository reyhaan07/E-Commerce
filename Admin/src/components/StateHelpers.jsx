import React from "react";
import { Link } from "react-router-dom";

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-square w-full" />
      <div className="flex flex-col gap-2 p-4">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-5 w-1/3" />
        <div className="skeleton h-9 w-full" />
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, actionLabel, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white px-6 py-16 text-center shadow-soft animate-fade-in">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-4xl text-brand-400">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      <p className="max-w-sm text-sm text-slate-500">{subtitle}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-2 text-sm">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
