import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const CustomerLogin = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const table = searchParams.get("table");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/customer/login", { phone, password });
      login(data);
      navigate(table ? `/menu?table=${table}` : "/menu");
    } catch (err) {
      console.error("Customer login error:", err);
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? "Cannot connect to server. Check backend."
          : "Invalid phone or password");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <div className="w-full max-w-md mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <span>←</span> Back to Role Portals
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 text-slate-100 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 backdrop-blur-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20 mb-3 text-2xl">
            🍽️
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Customer Dining Sign In</h1>
          <p className="text-xs text-slate-400 mt-1">
            {table ? "Ordering for your scanned table" : "Sign in to order food and view your bill"}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-sm flex items-start gap-2.5">
            <span className="text-red-400 font-bold">⚠️</span>
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-pink-600/30 transition duration-150 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? "Signing In..." : "Sign In to Order →"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-3">
          <p className="text-sm text-slate-400">
            First time dining?{" "}
            <Link
              to={table ? `/signup?table=${table}` : "/signup"}
              className="text-pink-400 hover:text-pink-300 font-semibold"
            >
              Create Diner Account
            </Link>
          </p>

          {/* Quick jump to staff */}
          <div className="pt-3 border-t border-slate-800/80">
            <Link
              to="/staff-login"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              <span>👔</span> Restaurant Owner or Staff? Log in here →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
