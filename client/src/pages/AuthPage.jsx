import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in p-4">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-primary-600 to-teal-800 text-white relative">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">{mode === "login" ? "Welcome back to Campus." : "Join the Campus Network."}</h1>
            <p className="text-primary-100 text-lg">Sign in to access your favorite shops and orders.</p>
          </div>
        </div>
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-slate-50">
          <div className="flex bg-slate-200/50 p-1 rounded-xl mb-8">
            <button type="button" className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${mode === "login" ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`} onClick={() => { setMode("login"); setError(""); }}>Sign In</button>
            <button type="button" className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${mode === "register" ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`} onClick={() => { setMode("register"); setError(""); }}>Create Account</button>
          </div>
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
            <input className="input-field" type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
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