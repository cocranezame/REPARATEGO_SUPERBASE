import { Outlet } from "react-router-dom";

export function MainLayout() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="w-64 shrink-0 bg-neutral-900 text-white">
        <div className="p-4">
          <span className="text-lg font-semibold">ReparaTego</span>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
