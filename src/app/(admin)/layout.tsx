import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import ErrorBoundary from "@/components/ErrorBoundary";
import AdminAuth from "@/components/AdminAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuth>
      <div className="min-h-screen">
        <Sidebar />
        {/* Main content: offset for sidebar on desktop, bottom padding for mobile nav */}
        <main className="md:ml-64 pb-24 md:pb-0 min-h-screen bg-gray-50">
          <ToastProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </ToastProvider>
        </main>
      </div>
    </AdminAuth>
  );
}
