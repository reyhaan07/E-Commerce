import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

export default function AdminNavbar() {
  return (
    <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <h2 className="font-semibold text-xl">
        E-Commerce Admin Panel
      </h2>

      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
        >
          <FaArrowLeft size={14} />
          Back to Store
        </Link>
        <span className="text-slate-600 font-medium">Admin</span>
      </div>
    </div>
  );
}