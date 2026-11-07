"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardCheck,
  ExternalLink,
  FileSpreadsheet,
  FolderLock,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftOpen,
  Plus,
  X,
} from "lucide-react";
import { TaltumLogo } from "@/components/taltum-logo";
import { logoutAction } from "@/app/actions";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Resumen General",
    shortLabel: "Inicio",
    icon: LayoutDashboard,
    mobileTab: true,
  },
  {
    href: "/empresas",
    label: "Empresas Cliente",
    shortLabel: "Empresas",
    icon: Building2,
    mobileTab: true,
  },
  {
    href: "/cotizaciones",
    label: "Cotizaciones",
    shortLabel: "Cotizar",
    icon: FileSpreadsheet,
    mobileTab: true,
  },
  {
    href: "/reportes",
    label: "Reportes y Actas",
    shortLabel: "Reportes",
    icon: ClipboardCheck,
    mobileTab: true,
  },
  {
    href: "/servicios",
    label: "Servicios y Formatos",
    shortLabel: "Formatos",
    icon: Layers,
    mobileTab: false,
  },
  {
    href: "/archivos",
    label: "Archivos y Enlaces",
    shortLabel: "Archivos",
    icon: FolderLock,
    mobileTab: true,
  },
];

export function SidebarNav({
  consultantName,
  consultantEmail,
}: {
  consultantName: string;
  consultantEmail: string;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const initials = consultantName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const fullSidebarContent = (
    <div className="flex h-full flex-col justify-between bg-petrol text-white">
      <div className="overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <Link href="/" onClick={() => setDrawerOpen(false)}>
            <TaltumLogo variant="light" />
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/75 hover:bg-white/10 lg:hidden cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Acciones rápidas pensadas para campo en Tablet/Celular */}
        <div className="grid grid-cols-2 gap-2 border-b border-white/10 px-4 py-3.5 lg:hidden">
          <Link
            href="/reportes/nuevo"
            onClick={() => setDrawerOpen(false)}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-dorado px-3 py-2 text-xs font-semibold text-white shadow-xs active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Reporte
          </Link>
          <Link
            href="/cotizaciones/nueva"
            onClick={() => setDrawerOpen(false)}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 text-dorado-light" />
            Cotizar
          </Link>
        </div>

        <nav className="space-y-1.5 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-dorado text-white shadow-xs"
                    : "text-white/75 hover:bg-white/10 hover:text-white active:bg-white/15"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 p-4 space-y-3">
        <a
          href="https://taltum.co"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-10 items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <span>Ver sitio público taltum.co</span>
          <ExternalLink className="h-3.5 w-3.5 text-dorado-light" />
        </a>

        <div className="flex items-center gap-2.5 rounded-xl bg-petrol-dark/70 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dorado/20 text-xs font-bold text-dorado-light">
            {initials || "TL"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {consultantName}
            </p>
            <p className="text-[11px] text-white/60 truncate">
              {consultantEmail}
            </p>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2.5 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. TOPBAR CELULAR (< 768px) */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-petrol/95 px-4 py-2.5 text-white backdrop-blur-md md:hidden">
        <Link href="/" className="py-0.5">
          <TaltumLogo variant="light" showSubtitle={false} />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/servicios"
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isActive("/servicios")
                ? "border-dorado bg-dorado text-white"
                : "border-white/15 bg-white/5 text-white/90"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-dorado-light" />
            Formatos
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white active:bg-white/15"
            aria-label="Abrir menú completo"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* 2. BARRA DE PESTAÑAS INFERIOR TÁCTIL CELULAR (< 768px) */}
      <nav
        aria-label="Navegación principal móvil"
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-border-soft bg-white/95 px-1.5 pt-1.5 pb-safe shadow-[0_-4px_20px_rgba(11,36,48,0.08)] backdrop-blur-md md:hidden"
      >
        <div className="grid grid-cols-5 gap-1">
          {NAV_ITEMS.filter((it) => it.mobileTab).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[11px] font-semibold transition ${
                  active
                    ? "bg-petrol text-white shadow-2xs"
                    : "text-gray-soft active:bg-bone-warm"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    active ? "text-dorado-light" : "text-petrol/75"
                  }`}
                />
                <span className="truncate max-w-full">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 3. RAIL LATERAL ERGONÓMICO PARA TABLET VERTICAL (768px - 1023px) */}
      <aside
        aria-label="Navegación para tablet"
        className="no-print hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-20 md:flex-col md:justify-between md:border-r md:border-white/10 md:bg-petrol md:py-4 md:text-white lg:hidden"
      >
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/"
            title="Inicio — Taltum Gestión"
            className="rounded-xl p-1 transition hover:bg-white/10"
          >
            <TaltumLogo variant="light" iconOnly />
          </Link>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            title="Expandir menú completo"
            className="inline-flex h-10 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Expandir menú completo"
          >
            <PanelLeftOpen className="h-4 w-4 text-dorado-light" />
          </button>

          <nav className="mt-1 flex w-full flex-col items-center gap-1.5 px-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-[58px] w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center transition ${
                    active
                      ? "bg-dorado text-white shadow-xs"
                      : "text-white/75 hover:bg-white/10 hover:text-white active:bg-white/15"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-[10px] font-semibold leading-none tracking-tight">
                    {item.shortLabel}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-2.5 border-t border-white/10 pt-3 px-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            title={`${consultantName} (${consultantEmail})`}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-petrol-dark text-xs font-bold text-dorado-light border border-white/10 cursor-pointer"
          >
            {initials || "TL"}
          </button>

          <form action={logoutAction} className="w-full">
            <button
              type="submit"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="flex h-10 w-full items-center justify-center rounded-xl border border-white/15 text-white/75 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* 4. DRAWER DESPLEGABLE (CELULAR Y TABLET) */}
      {drawerOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-petrol-dark/65 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 h-full w-80 max-w-[86vw] shadow-2xl">
            {fullSidebarContent}
          </div>
        </div>
      )}

      {/* 5. SIDEBAR COMPLETO (TABLET HORIZONTAL >= 1024px Y ESCRITORIO) */}
      <aside className="no-print hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        {fullSidebarContent}
      </aside>
    </>
  );
}
