"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
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
  MapPin,
  ClipboardList,
  TrendingDown,
  Wallet,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/encordoamento", label: "Nova Venda", icon: PlusCircle },
  { href: "/vendas", label: "Vendas", icon: ClipboardList },
  { href: "/devedores", label: "Devedores", icon: TrendingDown },
  { href: "/conta-corrente", label: "Conta Corrente", icon: Wallet },
  { href: "/scanner", label: "Scanner QR", icon: QrCode },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/produtos", label: "Catálogo", icon: Package },
  { href: "/automacoes", label: "Automações", icon: Bell },
  { href: "/localizacao", label: "Localização", icon: MapPin },
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
        <div className="flex items-center justify-center px-4 py-5 border-b border-border">
          <img src="/logo.jpeg" alt="Bill Encordoamento Profissional" className="w-44 object-contain" />
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
                  {item.label === "Nova Venda" ? "Novo" : item.label}
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
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hiddenItems = navItems.slice(4);
  const anyActive = hiddenItems.some((item) => pathname.startsWith(item.href));

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [open]);

  // Fechar ao navegar
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div ref={menuRef} className="relative flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] py-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
          anyActive || open ? "text-primary-600" : "text-foreground-muted"
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
      {open && (
        <div className="absolute bottom-full mb-2 right-0 bg-white border border-border rounded-xl shadow-lg min-w-[200px] py-1 z-50 max-h-[60vh] overflow-y-auto">
          {hiddenItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
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
      )}
    </div>
  );
}
