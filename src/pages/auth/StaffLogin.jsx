import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const roleHomeRoute = {
  chef: "/kitchen",
  cashier: "/cashier",
  owner: "/owner"
};

const StaffLogin = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/staff/login", { phone, password });
      login(data);
      const destination = roleHomeRoute[data.user.role] || "/owner";
      navigate(destination);
    } catch (err) {
      console.error("Staff login error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.code === "ERR_NETWORK"
          ? "Cannot connect to backend server. Make sure backend is running on http://localhost:5000"
          : "Invalid phone number or password.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-500 text-white shadow-lg shadow-indigo-500/20 mb-3 text-2xl">
            🔐
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Staff & Owner Portal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in with your registered phone number & password
          </p>
        </div>

        {/* Roles Hint Banner */}
        <div className="grid grid-cols-3 gap-2 mb-6 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs">
          <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-900/40">
            <span className="block text-base mb-0.5">👑</span>
            <span className="font-semibold text-indigo-300">Owner</span>
          </div>
          <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-900/40">
            <span className="block text-base mb-0.5">👨‍🍳</span>
            <span className="font-semibold text-amber-300">Chef</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/40">
            <span className="block text-base mb-0.5">💳</span>
            <span className="font-semibold text-emerald-300">Cashier</span>
          </div>
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
              Registered Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
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
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition duration-150 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Signing In...
              </>
            ) : (
              <>Sign In to Dashboard →</>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-3">
          <p className="text-sm text-slate-400">
            Registering a new restaurant?{" "}
            <Link to="/owner-signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Owner Sign Up
            </Link>
          </p>
          <p className="text-xs text-slate-400">
            Chefs & Cashiers: Your login credentials are created by your restaurant Owner.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
