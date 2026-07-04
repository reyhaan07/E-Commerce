import { FaCheckCircle, FaTruck, FaHourglassHalf, FaBoxOpen } from "react-icons/fa";

// Renders a pill for one of the 6 delivery statuses (or "Not Assigned" when null).
// Mirrors the same pill pattern used elsewhere in Admin (SellerManagement, OrderMonitoring).
const STYLES = {
  Assigned: { classes: "bg-blue-50 text-blue-700", icon: <FaBoxOpen /> },
  Accepted: { classes: "bg-indigo-50 text-indigo-700", icon: <FaCheckCircle /> },
  "Picked Up": { classes: "bg-yellow-50 text-yellow-700", icon: <FaHourglassHalf /> },
  "In Transit": { classes: "bg-yellow-50 text-yellow-700", icon: <FaTruck /> },
  "Out For Delivery": { classes: "bg-indigo-50 text-indigo-700", icon: <FaTruck /> },
  Delivered: { classes: "bg-green-50 text-green-700", icon: <FaCheckCircle /> },
};

export default function StatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
        Not Assigned
      </span>
    );
  }

  const style = STYLES[status] || { classes: "bg-slate-100 text-slate-600", icon: null };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${style.classes}`}>
      {style.icon}
      {status}
    </span>
  );
}
