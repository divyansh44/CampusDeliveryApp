import { useDeferredValue, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function HomePage() {
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    api.getShops().then(setShops).catch((error) => setMessage(error.message));
  }, []);

  const visibleShops = shops.filter((shop) => {
    const haystack = `${shop.name} ${shop.category || ""} ${shop.location}`.toLowerCase();
    return haystack.includes(deferredSearch.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-12 pb-24 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-teal-900/40 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary-500/20 blur-3xl"></div>
        
        <div className="relative z-10 px-8 py-20 md:px-16 md:py-32 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 space-y-6">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-500/20 text-primary-300 text-sm font-semibold tracking-wide uppercase">
              Campus Delivery
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              Food delivery, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-teal-300">simplified.</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl">
              Get fresh food and snacks safely delivered anywhere on campus.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link to="/auth" className="btn-primary">Get Started</Link>
              <a href="#shop-list" className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 backdrop-blur-md">Browse Shops</a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8 max-w-7xl mx-auto w-full" id="shop-list">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10">
          <div><span className="text-primary-600 font-semibold uppercase text-sm mb-2 block">Explore</span><h2 className="text-4xl font-bold text-slate-800">Campus Shops</h2></div>
          <input className="input-field max-w-md" placeholder="Search by name, category..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {message && <div className="text-red-500 bg-red-50 p-4 rounded-xl">{message}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleShops.map((shop) => (
            <article className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full" key={shop.id || shop._id}>
              <div className="h-48 bg-slate-100 relative">
                {shop.imageUrl ? <img className="w-full h-full object-cover group-hover:scale-105 transition-transform" src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}${shop.imageUrl}`} alt={shop.name} /> : <div className="w-full h-full flex items-center justify-center bg-primary-50"><span className="text-4xl">{shop.name.charAt(0)}</span></div>}
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold mb-2">{shop.name}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{shop.description || "Fresh campus food."}</p>
                <div className="mt-auto">
                   <Link to={`/shops/${shop.id || shop._id}`} className="block text-center flex-1 btn-secondary w-full">View Menu</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}