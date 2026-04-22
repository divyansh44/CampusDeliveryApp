import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function ShopPage() {
  const { shopId } = useParams();
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;

    Promise.all([api.getShop(shopId), api.getShopFeedback(shopId)])
      .then(([shopData, feedbackData]) => {
        setShop(shopData);
        setFeedback(feedbackData);
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, [shopId]);

  const handleAddToCart = async (menuItemId) => {
    if (!shopId) return;
    try {
      await api.addToCart({ shopId, menuItemId, quantity: 1 });
      setMessage("Item added to cart! Proceed to cart to checkout.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <svg className="animate-spin h-10 w-10 text-primary-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-500 rounded-2xl mx-auto max-w-lg mt-10 border border-red-100">
        <h2 className="text-xl font-bold mb-2">Shop Not Found</h2>
        <p>{message || "Could not load shop details."}</p>
        <Link to="/student" className="mt-4 inline-block btn-secondary">Go Back</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-20">
      
      {/* Fixed Alert Banner */}
      {message && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg border backdrop-blur-md font-semibold text-sm transition-all duration-300 animate-slide-up flex items-center gap-2 ${message.includes('added') ? 'bg-green-500/90 text-white border-green-600' : 'bg-red-500/90 text-white border-red-600'}`}>
          {message.includes('added') ? (
             <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          ) : (
             <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          )}
          {message}
        </div>
      )}

      {/* Shop Hero Container */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-2xl h-[400px]">
        {shop.imageUrl ? (
          <div className="absolute inset-0">
             <img src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}${shop.imageUrl}`} alt={shop.name} className="w-full h-full object-cover opacity-50" />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-800 to-teal-900">
             <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCIvPjwvc3ZnPg==')] opacity-20"></div>
          </div>
        )}
        
        <div className="absolute bottom-0 w-full p-8 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md backdrop-blur-md ${shop.is_open || shop.isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                {shop.is_open || shop.isOpen ? "OPEN NOW" : "CLOSED"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold text-teal-800 bg-teal-100 shadow-md">
                {shop.category || "General"}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-3 tracking-tight drop-shadow-md">
              {shop.name}
            </h1>
            
            <p className="text-lg text-slate-200 mb-6 drop-shadow-sm font-medium">
              {shop.description || "Grab your favorite meals right here."}
            </p>
            
            <div className="flex items-center gap-6 text-sm font-medium text-slate-300">
              <span className="flex items-center gap-2 bg-slate-800/60 py-1.5 px-4 rounded-full backdrop-blur-md border border-white/10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                {shop.location}
              </span>
              <span className="flex items-center gap-2 bg-slate-800/60 py-1.5 px-4 rounded-full backdrop-blur-md border border-white/10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                {shop.delivery_supported || shop.deliverySupported ? "Campus Delivery Available" : "Pickup Only"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Menu Section */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              Menu Items
            </h3>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-sm font-bold">
              {shop.menuItems?.length ?? 0} items
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {shop.menuItems?.map((item) => (
              <article key={item.id || item._id} className="group bg-white rounded-2xl border border-slate-100 p-5 flex flex-col hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                {/* Available Overlay if inactive */}
                {!(item.is_available || item.isAvailable) && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <span className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold shadow-lg transform -rotate-6">SOLD OUT</span>
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 pr-4">
                    <h4 className="text-lg font-bold text-slate-800 mb-1 leading-tight group-hover:text-primary-600 transition-colors">{item.name}</h4>
                    <span className="inline-block px-2 py-0.5 rounded-sm bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                      {item.category || "General"}
                    </span>
                    <p className="text-slate-500 text-sm line-clamp-2">
                       {item.description || "A delicious choice from our menu."}
                    </p>
                  </div>
                  
                  {item.imageUrl ? (
                     <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden shadow-sm border border-slate-100">
                        <img 
                          src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}${item.imageUrl}`} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                     </div>
                  ) : (
                     <div className="w-20 h-20 shrink-0 rounded-xl bg-gradient-to-br from-primary-50 to-teal-50 border border-slate-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                     </div>
                  )}
                </div>
                
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
                  <strong className="text-xl text-slate-800 font-bold">Rs. {Number(item.price).toFixed(2)}</strong>
                  {user?.role === "student" && (item.is_available || item.isAvailable) ? (
                    <button 
                      className="bg-primary-50 hover:bg-primary-500 text-primary-600 hover:text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 group-hover:shadow-md"
                      onClick={() => handleAddToCart(item.id || item._id)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                      Add
                    </button>
                  ) : (
                    <button disabled className="bg-slate-100 text-slate-400 px-4 py-2 rounded-lg font-bold text-sm cursor-not-allowed">
                       Unavailable
                    </button>
                  )}
                </div>
              </article>
            ))}
            
            {!shop.menuItems?.length && (
              <div className="col-span-full py-16 flex flex-col items-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
                <svg className="w-12 h-12 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                <p>No items menu available yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Feedback Section */}
        <section className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl lg:sticky lg:top-24">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
              Customer Reviews
            </h3>
            
            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {feedback.map((entry) => (
                <article key={entry.id || entry._id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-start justify-between mb-2">
                    <strong className="text-slate-700 font-bold">{entry.student_name || entry.student?.name || "Student"}</strong>
                    <div className="flex items-center gap-1 bg-yellow-100/50 text-yellow-700 px-2 py-0.5 rounded-lg text-xs font-bold">
                       <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                       {entry.rating}/5
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm">"{entry.comment || "No written comment left."}"</p>
                </article>
              ))}
              
              {!feedback.length && (
                <div className="text-center py-8 text-slate-400 text-sm font-medium">
                  No reviews yet for this shop.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}