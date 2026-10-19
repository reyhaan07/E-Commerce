import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  FaChartPie,
  FaUsers,
  FaStore,
  FaCheckDouble,
  FaBoxes,
  FaClipboardCheck,
  FaShoppingBag,
  FaUndo,
  FaChartLine,
  FaTruck,
  FaUserCheck,
  FaMapMarkerAlt,
  FaCompass,
  FaMoneyCheckAlt,
  FaUserShield,
  FaUserCircle,
  FaHeadset,
} from "react-icons/fa";

export default function AdminSidebar() {
  const { isSuperAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, children }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          active
            ? "bg-blue-600 text-white shadow-sm"
            : "text-slate-300 hover:text-white hover:bg-slate-800/70"
        }`}
      >
        {Icon && <Icon className={`text-base shrink-0 ${active ? "text-white" : "text-slate-400"}`} />}
        <span>{children}</span>
      </Link>
    );
  };

  const SectionTitle = ({ children }) => (
    <div className="mt-4 mb-1.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </div>
  );

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <Link to="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
            S
          </div>
          <div>
            <div className="font-display font-extrabold text-lg text-white leading-tight tracking-tight">
              ShopSphere
            </div>
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              Admin Console
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="p-3.5 flex flex-col gap-1 overflow-y-auto flex-1 text-sm">
        <NavLink to="/admin/dashboard" icon={FaChartPie}>
          Dashboard
        </NavLink>

        <SectionTitle>Management</SectionTitle>
        <NavLink to="/admin/users" icon={FaUsers}>
          User Management
        </NavLink>
        <NavLink to="/admin/sellers" icon={FaStore}>
          Seller Management
        </NavLink>
        <NavLink to="/admin/seller-verification" icon={FaCheckDouble}>
          Seller Verification
        </NavLink>
        <NavLink to="/admin/products" icon={FaBoxes}>
          Product Management
        </NavLink>
        <NavLink to="/admin/product-approval" icon={FaClipboardCheck}>
          Product Approval
        </NavLink>
        <NavLink to="/admin/orders" icon={FaShoppingBag}>
          Order Monitoring
        </NavLink>
        <NavLink to="/admin/refunds" icon={FaUndo}>
          Refund Tracking
        </NavLink>
        <NavLink to="/admin/analytics" icon={FaChartLine}>
          Analytics Dashboard
        </NavLink>
        <NavLink to="/admin/support" icon={FaHeadset}>
          Support Inquiries
        </NavLink>

        <SectionTitle>Delivery Management</SectionTitle>
        <NavLink to="/admin/delivery-partners" icon={FaTruck}>
          Delivery Partners
        </NavLink>
        <NavLink to="/admin/delivery-assignment" icon={FaUserCheck}>
          Assign Deliveries
        </NavLink>
        <NavLink to="/admin/delivery-tracking" icon={FaMapMarkerAlt}>
          Delivery Tracking
        </NavLink>
        <NavLink to="/admin/delivery-analytics" icon={FaChartLine}>
          Delivery Analytics
        </NavLink>
        <NavLink to="/admin/delivery-coverage" icon={FaCompass}>
          Delivery Coverage
        </NavLink>

        {isSuperAdmin && (
          <>
            <SectionTitle>Platform</SectionTitle>
            <NavLink to="/admin/payroll" icon={FaMoneyCheckAlt}>
              Payroll
            </NavLink>
            <NavLink to="/admin/admins" icon={FaUserShield}>
              Admin Management
            </NavLink>
          </>
        )}

        <SectionTitle>Account</SectionTitle>
        <NavLink to="/admin/profile" icon={FaUserCircle}>
          My Profile
        </NavLink>
      </div>
    </aside>
  );
}