import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEMO_ACCOUNTS = [
  { label: "Student", role: "student", email: "student@iitism.ac.in", password: "password123", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { label: "Vendor",  role: "vendor",  email: "vendor@iitism.ac.in",  password: "password123", color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" },
  { label: "Driver",  role: "delivery",email: "driver@iitism.ac.in",  password: "password123", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
  { label: "Admin",   role: "admin",   email: "admin@iitism.ac.in",   password: "admin123",    color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
];

export default function AuthPage() {
  const { login, register, googleAuthenticate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "student" });

  const nextPath = (role) => location.state?.from || (role === "student" ? "/student" : role === "vendor" ? "/vendor" : role === "delivery" ? "/delivery" : "/admin");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const user = mode === "login" ? await login({ email: form.email, password: form.password }) : await register(form);
      navigate(nextPath(user.role));
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = async (account) => {
    setMode("login");
    setError("");
    setForm(f => ({ ...f, email: account.email, password: account.password }));
    // Auto-submit after filling
    setSubmitting(true);
    try {
      const user = await login({ email: account.email, password: account.password });
      navigate(nextPath(user.role));
    } catch (err) {
      setError(err.message || "Demo login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in p-4">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-primary-600 to-teal-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 70% 20%, white 1px, transparent 1px)", backgroundSize:"24px 24px"}}></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">{mode === "login" ? "Welcome back to Campus." : "Join the Campus Network."}</h1>
            <p className="text-primary-100 text-lg">Sign in to access your favorite shops and orders.</p>
          </div>
          {/* Demo accounts panel */}
          <div className="relative z-10 mt-10">
            <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(account => (
                <button
                  key={account.role}
                  onClick={() => fillDemo(account)}
                  disabled={submitting}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold rounded-xl px-3 py-2.5 transition-all text-left disabled:opacity-50"
                >
                  <span className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-0.5">{account.label}</span>
                  <span className="text-white/90 text-xs truncate block">{account.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-slate-50">
          <div className="flex bg-slate-200/50 p-1 rounded-xl mb-6">
            <button type="button" className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${mode === "login" ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`} onClick={() => { setMode("login"); setError(""); }}>Sign In</button>
            <button type="button" className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${mode === "register" ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`} onClick={() => { setMode("register"); setError(""); }}>Create Account</button>
          </div>

          {/* Mobile-only demo buttons */}
          {mode === "login" && (
            <div className="md:hidden mb-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Demo</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map(account => (
                  <button key={account.role} onClick={() => fillDemo(account)} disabled={submitting}
                    className={`text-xs font-bold border rounded-xl px-3 py-2 transition-all text-left disabled:opacity-50 ${account.color}`}>
                    <span className="block font-bold">{account.label}</span>
                    <span className="opacity-70 truncate block text-[10px]">{account.password}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="grid grid-cols-1 gap-5 animate-slide-up">
                <input className="input-field" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="student">Student</option><option value="vendor">Vendor</option><option value="delivery">Delivery Driver</option>
                </select>
                <input className="input-field" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            )}
            <input className="input-field" type="email" placeholder="Email address (e.g. user@iitism.ac.in)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            {form.email && !form.email.toLowerCase().endsWith("@iitism.ac.in") && (
              <p className="text-xs text-amber-600 -mt-3 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Only @iitism.ac.in email addresses are authorised.
              </p>
            )}
            <input className="input-field" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            {error && <div className="text-red-500 font-medium text-sm">{error}</div>}
            <button className="btn-primary mt-2 py-3.5 text-lg" type="submit" disabled={submitting}>
              {submitting ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div className="flex justify-center mt-4">
                <GoogleLogin
                  onSuccess={async (cred) => {
                    if (!cred.credential) return setError("Missing Google credential.");
                    try {
                      const u = await googleAuthenticate(cred.credential, mode === "register" ? form.role : undefined);
                      navigate(nextPath(u.role));
                    } catch (e) { setError(e.message || "Google signin failed."); }
                  }}
                  onError={() => setError("Google sign-in failed.")} theme="filled_black" shape="pill"
                />
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}