import { Link } from "react-router-dom";

export default function AdminSidebar() {
  return (
    <div className="w-64 min-h-screen bg-slate-900 text-white p-5">
      <h1 className="text-2xl font-bold mb-8">
        Shop Admin
      </h1>

      <div className="flex flex-col gap-4">

        <Link to="/admin/dashboard">Dashboard</Link>

        <Link to="/admin/users">
          User Management
        </Link>

        <Link to="/admin/sellers">
          Seller Management
        </Link>

        <Link to="/admin/seller-verification">
          Seller Verification
        </Link>

        <Link to="/admin/products">
          Product Management
        </Link>
        
        <Link to="/admin/product-approval">
          Product Approval
        </Link>

        <Link to="/admin/orders">
          Order Monitoring
        </Link>

        <Link to="/admin/reviews">
          Review Moderation
        </Link>

        <Link to="/admin/refunds">
          Refund Tracking
        </Link>

        <Link to="/admin/analytics">
          Analytics Dashboard
        </Link>

        <div className="mt-2 pt-2 border-t border-slate-700 text-xs uppercase tracking-wide text-slate-400">
          Delivery Management
        </div>

        <Link to="/admin/delivery-partners">
          Delivery Partners
        </Link>

        <Link to="/admin/delivery-assignment">
          Assign Deliveries
        </Link>

        <Link to="/admin/delivery-tracking">
          Delivery Tracking
        </Link>

        <Link to="/admin/delivery-analytics">
          Delivery Analytics
        </Link>

      </div>
    </div>
  );
}