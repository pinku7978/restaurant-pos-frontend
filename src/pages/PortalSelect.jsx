import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosInstance";

const PortalSelect = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    // Quick probe to check if backend is reachable
    api.get("/tables/token/ping_check")
      .then(() => setBackendStatus("online"))
      .catch((err) => {
        // Any response from express (even 400/404) means server is running
        if (err.response) {
          setBackendStatus("online");
        } else {
          setBackendStatus("offline");
        }
      });
  }, []);

  const getDashboardPath = (role) => {
    switch (role) {
      case "owner":
        return "/owner";
      case "chef":
        return "/kitchen";
      case "cashier":
        return "/cashier";
      case "customer":
        return "/menu";
      default:
        return "/login";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Dynamic ambient background glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 relative z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/25">
              🍽️
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                RestoPulse POS
              </span>
              <span className="block text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Restaurant Operating System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Backend health indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === "online"
                    ? "bg-emerald-400 animate-pulse"
                    : backendStatus === "checking"
                    ? "bg-yellow-400"
                    : "bg-red-400"
                }`}
              />
              <span className="text-slate-400">
                {backendStatus === "online"
                  ? "Backend Connected"
                  : backendStatus === "checking"
                  ? "Checking Backend..."
                  : "Backend Offline (Port 5000)"}
              </span>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300">
                  Signed in as <strong className="text-white capitalize">{user.name}</strong> ({user.role})
                </span>
                <button
                  onClick={() => navigate(getDashboardPath(user.role))}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Go to Screen →
                </button>
                <button
                  onClick={logout}
                  className="text-xs text-slate-400 hover:text-white border border-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/staff-login"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium border border-indigo-500/30 px-3.5 py-1.5 rounded-lg transition-colors"
              >
                Staff Login →
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero / Portal Selection */}
      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10 w-full flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-xs font-medium mb-4">
            <span>✨</span> Role-Based Architecture
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Select Your Workspace
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            RestoPulse connects your Owner management, Kitchen order displays, Cashier billing POS, and Table dining into one real-time system.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Restaurant Owner */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                👑
              </div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-white">Owner Portal</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Register your restaurant, manage digital menu items, configure tables & QR codes, assign Chef/Cashier roles, and review revenue reports.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800">
              <Link
                to="/owner-signup"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold py-2.5 rounded-xl block text-center shadow-md shadow-indigo-600/20 transition-all"
              >
                Register Restaurant
              </Link>
              <Link
                to="/staff-login"
                className="w-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 rounded-xl block text-center border border-slate-700 transition-all"
              >
                Owner Sign In
              </Link>
            </div>
          </div>

          {/* Card 2: Chef / Kitchen */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                👨‍🍳
              </div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-white">Kitchen Display</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  Chef
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Live Kitchen Order Tickets (KOT) with instant audio alert & speech synthesis. Update item status from New → Preparing → Ready → Served.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800">
              <Link
                to="/staff-login"
                className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold py-2.5 rounded-xl block text-center shadow-md shadow-amber-600/20 transition-all"
              >
                Chef Sign In
              </Link>
              <span className="text-[11px] text-slate-400 block text-center">
                Requires Chef role created by Owner
              </span>
            </div>
          </div>

          {/* Card 3: Cashier */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                💳
              </div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-white">Cashier POS</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Billing
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Active dining sessions, table bill generation, real-time bill request chimes, and instant Cash or Card payment settlements.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800">
              <Link
                to="/staff-login"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-xl block text-center shadow-md shadow-emerald-600/20 transition-all"
              >
                Cashier Sign In
              </Link>
              <span className="text-[11px] text-slate-400 block text-center">
                Requires Cashier role created by Owner
              </span>
            </div>
          </div>

          {/* Card 4: Customer */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-pink-500/60 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-500/10 group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                📱
              </div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-white">Customer Dining</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
                  Diner
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Scan table QR code to explore categories, customize portion sizes, place orders straight to the kitchen, and call for bills.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800">
              <Link
                to="/login"
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2.5 rounded-xl block text-center border border-slate-700 transition-all"
              >
                Customer Sign In
              </Link>
              <Link
                to="/signup"
                className="w-full text-xs text-pink-400 hover:text-pink-300 font-medium py-1 block text-center transition-all"
              >
                Create Diner Account →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-400 relative z-10">
        <p>RestoPulse POS Multi-Tenant System • Express + MongoDB + Socket.IO + React Vite</p>
      </footer>
    </div>
  );
};

export default PortalSelect;
