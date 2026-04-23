export default function StatusBadge({ status }) {
  const normalized = status.replaceAll("_", " ");
  
  const getBadgeColors = () => {
    switch (status) {
      case "pending": return "bg-orange-100 text-orange-700 border-orange-200";
      case "preparing": return "bg-blue-100 text-blue-700 border-blue-200";
      case "ready": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "picked_up": return "bg-teal-100 text-teal-700 border-teal-200";
      case "delivered": return "bg-green-100 text-green-700 border-green-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      case "issue_reported": return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getBadgeColors()} shadow-sm`}>
      {normalized}
    </span>
  );
}
