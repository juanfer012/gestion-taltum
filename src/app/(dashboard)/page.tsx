import Link from "next/link";
import {
  Building2,
  ClipboardCheck,
  Eye,
  FileSpreadsheet,
  FolderLock,
  Plus,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  COMPANY_STATUS_STYLES,
  QUOTE_STATUS_STYLES,
  REPORT_STATUS_STYLES,
  formatCOP,
  formatDate,
  formatDateTime,
} from "@/lib/format";
import type {
  CompanyStatus,
  QuoteStatus,
  ReportStatus,
} from "@/lib/types";

export default async function DashboardHomePage() {
  const supabase = await createClient();

  const [
    companiesRes,
    quotesRes,
    reportsRes,
    filesCountRes,
    shareLinksRes,
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, nit, status, risk_level, employee_count, city, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("quotes")
      .select(
        "id, quote_number, title, status, total, issue_date, companies(name)"
      )
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("reports")
      .select(
        "id, report_code, title, pillar, status, visit_date, companies(name)"
      )
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("files")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("share_links")
      .select(
        "id, token, label, resource_type, is_active, views_count, last_viewed_at, companies(name)"
      )
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const schemaReady = !companiesRes.error || !companiesRes.error.message.includes("schema cache");

  const companies = companiesRes.data ?? [];
  const quotes = quotesRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const shareLinks = shareLinksRes.data ?? [];

  const activeCompanies = companies.filter((c) => c.status === "activo").length;
  const prospectCompanies = companies.filter((c) => c.status === "prospecto").length;
  const pendingQuotesValue = quotes
    .filter((q) => q.status === "enviada" || q.status === "borrador")
    .reduce((acc, q) => acc + Number(q.total ?? 0), 0);
  const totalLinkViews = shareLinks.reduce(
    (acc, s) => acc + Number(s.views_count ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Encabezado y Acciones Rápidas */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-petrol">
            Panel Operativo Taltum
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-soft">
            Control centralizado de empresas cliente, cotizaciones, reportes
            técnicos y enlaces compartidos.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:items-center lg:gap-2.5">
          <Link
            href="/empresas?nueva=1"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-petrol/20 bg-white px-4 py-2.5 text-xs font-semibold text-petrol transition hover:bg-bone-warm active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 text-dorado" />
            Nueva Empresa
          </Link>
          <Link
            href="/cotizaciones/nueva"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-dorado px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-dorado-dark active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nueva Cotización
          </Link>
          <Link
            href="/reportes/nuevo"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-petrol px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-petrol-light active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 text-dorado-light" />
            Nuevo Reporte
          </Link>
        </div>
      </div>

      {!schemaReady && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">
               Migración SQL pendiente de aplicar en Supabase
            </p>
            <p className="mt-1 text-xs text-amber-800">
              Ejecuta el archivo{" "}
              <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">
                supabase/migrations/20261106000001_gestion_taltum_schema.sql
              </code>{" "}
              para habilitar todas las tablas, políticas RLS y el bucket privado{" "}
              <code className="font-mono">taltum-files</code>.
            </p>
          </div>
        </div>
      )}

      {/* KPIs: 2x2 compacto en celular y tablet, 4 en escritorio ancho */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-border-soft bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-soft leading-tight">
              Empresas
            </span>
            <span className="rounded-xl bg-petrol/10 p-2 text-petrol shrink-0">
              <Building2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2.5 text-2xl sm:text-3xl font-bold text-petrol">
            {companies.length}
          </div>
          <p className="mt-1 text-[11px] sm:text-xs text-gray-soft">
            <span className="font-semibold text-emerald-700">
              {activeCompanies} activas
            </span>{" "}
            · {prospectCompanies} prosp.
          </p>
        </div>

        <div className="rounded-2xl border border-border-soft bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-soft leading-tight">
              Pipeline
            </span>
            <span className="rounded-xl bg-dorado/15 p-2 text-dorado-dark shrink-0">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2.5 text-lg sm:text-2xl font-bold text-petrol truncate">
            {formatCOP(pendingQuotesValue)}
          </div>
          <p className="mt-1 text-[11px] sm:text-xs text-gray-soft truncate">
            Propuestas activas
          </p>
        </div>

        <div className="rounded-2xl border border-border-soft bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-soft leading-tight">
              Reportes
            </span>
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 shrink-0">
              <ClipboardCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2.5 text-2xl sm:text-3xl font-bold text-petrol">
            {reports.length}
          </div>
          <p className="mt-1 text-[11px] sm:text-xs text-gray-soft truncate">
            SST, GH y Ergonomía
          </p>
        </div>

        <div className="rounded-2xl border border-border-soft bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-soft leading-tight">
              Archivos
            </span>
            <span className="rounded-xl bg-sky-50 p-2 text-sky-700 shrink-0">
              <FolderLock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2.5 text-2xl sm:text-3xl font-bold text-petrol">
            {filesCountRes.count ?? 0}
          </div>
          <p className="mt-1 text-[11px] sm:text-xs text-gray-soft inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 shrink-0 text-dorado" />
            <span className="truncate">{totalLinkViews} vistas cliente</span>
          </p>
        </div>
      </div>

      {/* Grilla Inferior: Empresas, Cotizaciones y Enlaces Compartidos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Últimas Empresas */}
        <div className="lg:col-span-5 rounded-xl border border-border-soft bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border-soft pb-3.5">
            <h2 className="text-base font-bold text-petrol">
              Empresas Cliente Recientes
            </h2>
            <Link
              href="/empresas"
              className="inline-flex items-center gap-1 text-xs font-semibold text-dorado-dark hover:underline"
            >
              Ver todas
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {companies.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-soft">
              Aún no hay empresas registradas.{" "}
              <Link
                href="/empresas?nueva=1"
                className="font-semibold text-petrol underline"
              >
                Registrar la primera empresa
              </Link>
              .
            </div>
          ) : (
            <ul className="divide-y divide-border-soft/70 mt-2">
              {companies.slice(0, 5).map((comp) => {
                const st =
                  COMPANY_STATUS_STYLES[comp.status as CompanyStatus] ??
                  COMPANY_STATUS_STYLES.activo;
                return (
                  <li key={comp.id} className="py-3">
                    <Link
                      href={`/empresas/${comp.id}`}
                      className="flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-petrol group-hover:text-dorado-dark truncate">
                          {comp.name}
                        </p>
                        <p className="text-xs text-gray-soft">
                          NIT {comp.nit} · Riesgo {comp.risk_level} ·{" "}
                          {comp.employee_count} colab.
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${st.className}`}
                      >
                        {st.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Últimas Cotizaciones y Reportes */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-border-soft bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border-soft pb-3.5">
              <h2 className="text-base font-bold text-petrol">
                Cotizaciones Recientes
              </h2>
              <Link
                href="/cotizaciones"
                className="inline-flex items-center gap-1 text-xs font-semibold text-dorado-dark hover:underline"
              >
                Ir a cotizaciones
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {quotes.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-soft">
                No hay cotizaciones creadas todavía.
              </p>
            ) : (
              <div className="mt-2 divide-y divide-border-soft/70">
                {quotes.slice(0, 4).map((q) => {
                  const st =
                    QUOTE_STATUS_STYLES[q.status as QuoteStatus] ??
                    QUOTE_STATUS_STYLES.borrador;
                  const compRel = Array.isArray(q.companies)
                    ? q.companies[0]
                    : q.companies;
                  return (
                    <Link
                      key={q.id}
                      href={`/cotizaciones/${q.id}`}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-3.5 hover:bg-bone-white/60 px-2 -mx-2 rounded-xl transition"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-petrol truncate">
                          <span className="font-mono text-xs text-dorado-dark mr-2">
                            {q.quote_number}
                          </span>
                          {q.title}
                        </p>
                        <p className="text-xs text-gray-soft">
                          {compRel?.name ?? "Empresa"} · {formatDate(q.issue_date)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className="text-sm font-bold text-petrol">
                          {formatCOP(q.total)}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actividad de Enlaces Compartidos y Reportes */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border-soft bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-border-soft pb-3">
                <h2 className="text-sm font-bold text-petrol">
                  Últimos Reportes
                </h2>
                <Link
                  href="/reportes"
                  className="text-xs font-semibold text-dorado-dark hover:underline"
                >
                  Ver todos
                </Link>
              </div>
              {reports.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-soft">
                  Sin reportes emitidos.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border-soft/70">
                  {reports.slice(0, 3).map((rep) => {
                    const st =
                      REPORT_STATUS_STYLES[rep.status as ReportStatus] ??
                      REPORT_STATUS_STYLES.borrador;
                    const compRel = Array.isArray(rep.companies)
                      ? rep.companies[0]
                      : rep.companies;
                    return (
                      <li key={rep.id} className="py-2.5">
                        <Link
                          href={`/reportes/${rep.id}`}
                          className="block hover:opacity-80"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-semibold text-dorado-dark">
                              {rep.report_code}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${st.className}`}
                            >
                              {st.label}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs font-semibold text-petrol truncate">
                            {rep.title}
                          </p>
                          <p className="text-[11px] text-gray-soft truncate">
                            {compRel?.name} · {formatDate(rep.visit_date)}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-border-soft bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-border-soft pb-3">
                <h2 className="text-sm font-bold text-petrol">
                  Aperturas de Enlaces (/s/)
                </h2>
                <Link
                  href="/archivos"
                  className="text-xs font-semibold text-dorado-dark hover:underline"
                >
                  Gestionar
                </Link>
              </div>
              {shareLinks.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-soft">
                  Aún no has compartido enlaces con clientes.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border-soft/70">
                  {shareLinks.slice(0, 3).map((sl) => {
                    const compRel = Array.isArray(sl.companies)
                      ? sl.companies[0]
                      : sl.companies;
                    return (
                      <li key={sl.id} className="py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-petrol truncate">
                            {sl.label ?? sl.resource_type}
                          </p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-bone-warm px-2 py-0.5 text-[11px] font-semibold text-petrol">
                            <Eye className="h-3 w-3 text-dorado" />
                            {sl.views_count}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-soft truncate">
                          {compRel?.name} · {formatDateTime(sl.last_viewed_at)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
