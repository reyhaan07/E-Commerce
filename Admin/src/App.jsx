import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import { ShopProvider } from "./context/ShopContext";

export default function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

const isAuthPage =
  ["/login", "/register"].includes(location.pathname) || isAdminPage;

  return (
    <ShopProvider>
      <div className="flex min-h-screen flex-col bg-surface">
        {!isAuthPage && <Navbar />}
        <main className="flex-1 pb-16 sm:pb-0">
          <AppRoutes />
        </main>
        {!isAuthPage && <Footer />} 
      </div>
    </ShopProvider>  
  );
}
