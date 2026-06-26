import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminNavbar from "../components/AdminNavbar";

export default function AdminLayout() {
  return (
    <div className="flex">

      <AdminSidebar />

      <div className="flex-1 bg-gray-100 min-h-screen">

        <AdminNavbar />

        <div className="p-6">
          <Outlet />
        </div>

      </div>

    </div>
  );
}