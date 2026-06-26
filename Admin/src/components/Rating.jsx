import React from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

export default function Rating({ value = 0, reviews, size = "text-sm", showCount = true }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) stars.push(<FaStar key={i} className="text-amber-400" />);
    else if (value >= i - 0.5) stars.push(<FaStarHalfAlt key={i} className="text-amber-400" />);
    else stars.push(<FaRegStar key={i} className="text-amber-400" />);
  }

  return (
    <div className={`flex items-center gap-1 ${size}`}>
      <div className="flex items-center gap-0.5">{stars}</div>
      <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
        {value.toFixed(1)}
      </span>
      {showCount && reviews !== undefined && (
        <span className="text-xs text-slate-400">({reviews.toLocaleString("en-IN")})</span>
      )}
    </div>
  );
}
