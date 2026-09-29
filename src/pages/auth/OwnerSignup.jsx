import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const OwnerSignup = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    restaurantName: "",
    restaurantAddress: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/owner/register", form);
      // login saves token, user info and restaurantId to localStorage & state
      login(data);
      navigate("/owner");
    } catch (err) {
      console.error("Owner registration error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.code === "ERR_NETWORK"
          ? "Cannot connect to backend server. Make sure backend is running on http://localhost:5000"
          : "Registration failed. Please check your details and try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <div className="w-full max-w-lg mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <span>←</span> Back to Role Portals
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 text-slate-100 p-8 rounded-2xl shadow-2xl w-full max-w-lg relative z-10 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 mb-3 text-2xl">
            👑
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Register Your Restaurant</h1>
          <p className="text-sm text-slate-400 mt-1">
            Create your restaurant profile and your Master Owner account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-sm flex items-start gap-3">
            <span className="text-red-400 font-bold mt-0.5">⚠️</span>
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 space-y-3">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-indigo-400">
              Restaurant Details
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Restaurant Name <span className="text-red-400">*</span>
              </label>
              <input
                name="restaurantName"
                value={form.restaurantName}
                onChange={handleChange}
                placeholder="e.g. Spice Symphony Bistro"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Restaurant Address / City
              </label>
              <input
                name="restaurantAddress"
                value={form.restaurantAddress}
                onChange={handleChange}
                placeholder="e.g. 42 Food Street, Mumbai"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 space-y-3">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-purple-400">
              Owner Credentials (Sign In Info)
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Owner Full Name <span className="text-red-400">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Suraj Nayak"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Phone Number (Used for Login) <span className="text-red-400">*</span>
              </label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                You will use this phone number and password to log in at the Staff/Owner portal.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a secure password"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition duration-150 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creating Restaurant Profile...
              </>
            ) : (
              <>Create Restaurant & Owner Account →</>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-2">
          <p className="text-sm text-slate-400">
            Already registered?{" "}
            <Link to="/staff-login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Log in to Staff/Owner Portal
            </Link>
          </p>
          <p className="text-xs text-slate-400">
            Looking for customer dining?{" "}
            <Link to="/login" className="text-slate-400 hover:text-slate-300">
              Customer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerSignup;
