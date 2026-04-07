"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  DollarSign,
  Package,
  MessageCircle,
  BookOpen,
  QrCode,
  Bell,
  ShoppingBag,
  Brain,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/encordoamento", label: "Novo Encordoamento", icon: PlusCircle },
  { href: "/scanner", label: "Scanner QR", icon: QrCode },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/produtos", label: "Catálogo", icon: Package },
  { href: "/automacoes", label: "Automações", icon: Bell },
  { href: "/loja", label: "Loja/Pedidos", icon: ShoppingBag },
  { href: "/comunidade", label: "Comunidade", icon: MessageCircle },
  { href: "/comunidade/perfis", label: "Jogadores", icon: Users },
  { href: "/inteligencia", label: "Inteligência", icon: Brain },
  { href: "/conteudo", label: "Conteúdo", icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-r md:border-border md:bg-white">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-600 text-white font-bold text-lg">
            B
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">
              Bill Encordoamentos
            </h1>
            <p className="text-xs text-foreground-muted">Gestão de serviços</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
                }`}
              >
                <Icon
                  size={20}
                  className={active ? "text-primary-600" : "text-foreground-muted"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border">
          <p className="text-xs text-foreground-muted text-center">
            &copy; 2026 Bill Encordoamentos
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border">
        <div className="flex items-center justify-around h-[4.5rem] px-1">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-primary-600" : "text-foreground-muted"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="truncate max-w-[64px]">
                  {item.label === "Novo Encordoamento" ? "Novo" : item.label}
                </span>
              </Link>
            );
          })}
          {/* More menu for remaining items */}
          <MoreMenu pathname={pathname} />
        </div>
      </nav>
    </>
  );
}

function MoreMenu({ pathname }: { pathname: string }) {
  const hiddenItems = navItems.slice(4);
  const anyActive = hiddenItems.some((item) => pathname.startsWith(item.href));

  return (
    <div className="relative flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] py-2 group">
      <button
        className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
          anyActive ? "text-primary-600" : "text-foreground-muted"
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
        <span>Mais</span>
      </button>

      {/* Dropdown going up */}
      <div className="absolute bottom-full mb-2 right-0 hidden group-focus-within:block bg-white border border-border rounded-xl shadow-lg min-w-[180px] py-1 z-50">
        {hiddenItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-50 text-primary-700"
                  : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
