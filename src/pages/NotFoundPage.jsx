import { Link } from "react-router-dom";
export default function NotFoundPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-surface h-screen">
      <div className="font-label text-[10px] text-outline uppercase tracking-widest">Error 404</div>
      <div className="text-3xl font-bold text-on-surface tracking-tight">Page not found</div>
      <p className="text-on-surface-variant text-sm">This route doesn't exist in the SmartFlow platform.</p>
      <Link to="/" className="mt-4 px-6 py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary/90 transition-all">
        ← Back to home
      </Link>
    </div>
  );
}
