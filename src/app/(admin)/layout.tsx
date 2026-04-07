import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      {/* Main content: offset for sidebar on desktop, bottom padding for mobile nav */}
      <main className="md:ml-64 pb-24 md:pb-0 min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  );
}
