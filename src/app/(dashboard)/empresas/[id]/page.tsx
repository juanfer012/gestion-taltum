import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ClipboardCheck,
  FileSpreadsheet,
  FolderLock,
  Layers,
  Mail,
  MessageCircle,
  Plus,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  assignServiceToCompanyAction,
  updateCompanyAction,
} from "@/app/actions";
import {
  ARL_OPTIONS,
  COMPANY_STATUS_STYLES,
  FILE_CATEGORY_LABELS,
  PILLAR_BADGES,
  PILLAR_LABELS,
  QUOTE_STATUS_STYLES,
  REPORT_STATUS_STYLES,
  formatBytes,
  formatCOP,
  formatDate,
  getRes0312Standard,
} from "@/lib/format";
import { FileUploader } from "@/components/file-uploader";
import { FileOpenButton } from "@/components/file-open-button";
import { ShareLinkModal } from "@/components/share-link-modal";
import type {
  CompanyStatus,
  ExtendedPillar,
  FileCategory,
  QuoteStatus,
  ReportStatus,
  RiskLevel,
} from "@/lib/types";

export default async function EmpresaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!company) {
    notFound();
  }

  const [
    servicesCatalogRes,
    templatesRes,
    companyServicesRes,
    quotesRes,
    reportsRes,
    filesRes,
  ] = await Promise.all([
    supabase.from("services").select("*").eq("is_active", true).order("pillar"),
    supabase.from("templates").select("id, code, name").eq("is_active", true),
    supabase
      .from("company_services")
      .select("*, services(code, name, pillar, billing_type)")
      .eq("company_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("quotes")
      .select("*")
      .eq("company_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reports")
      .select("*, templates(code, version)")
      .eq("company_id", id)
      .order("visit_date", { ascending: false }),
    supabase
      .from("files")
      .select("*")
      .eq("company_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const statusStyle =
    COMPANY_STATUS_STYLES[company.status as CompanyStatus] ??
    COMPANY_STATUS_STYLES.activo;
  const res0312 = getRes0312Standard(
    company.employee_count,
    (company.risk_level as RiskLevel) || "I"
  );

  const cleanPhone = (company.contact_phone ?? "").replace(/[^\d]/g, "");
  const waPhone = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone;
  const updateWithId = updateCompanyAction.bind(null, company.id);

  return (
    <div className="space-y-8">
      {/* Navegación superior */}
      <div>
        <Link
          href="/empresas"
          className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-gray-soft hover:text-petrol"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Empresas Cliente
        </Link>

        <div className="mt-2.5 flex flex-col gap-5 rounded-2xl border border-border-soft bg-white p-5 sm:p-6 shadow-2xs xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-petrol">
                {company.name}
              </h1>
              <span
                className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${statusStyle.className}`}
              >
                {statusStyle.label}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-soft leading-relaxed">
              <strong className="font-mono text-petrol">NIT {company.nit}</strong>{" "}
              · {company.city}
              {company.sector ? ` · Sector ${company.sector}` : ""}
              {company.arl ? ` · ${company.arl}` : ""} · Riesgo{" "}
              {company.risk_level} · {company.employee_count} colaboradores
            </p>

            <div className="inline-flex items-center gap-2 rounded-xl border border-dorado/30 bg-dorado/10 px-3 py-1.5 text-xs font-semibold text-petrol">
              <ShieldCheck className="h-4 w-4 shrink-0 text-dorado-dark" />
              <span>Clasificación Normativa: {res0312.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {waPhone && (
              <a
                href={`https://wa.me/${waPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2 text-xs font-semibold text-white hover:opacity-95 active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                WhatsApp
              </a>
            )}
            <a
              href={`mailto:${company.contact_email}`}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border-soft bg-bone-white px-3.5 py-2 text-xs font-semibold text-petrol hover:bg-bone-warm active:scale-[0.98] truncate"
            >
              <Mail className="h-4 w-4 shrink-0 text-dorado" />
              <span className="truncate">{company.contact_name}</span>
            </a>
            <Link
              href={`/cotizaciones/nueva?empresa=${company.id}`}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-dorado px-3.5 py-2 text-xs font-semibold text-white hover:bg-dorado-dark active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Cotizar
            </Link>
            <Link
              href={`/reportes/nuevo?empresa=${company.id}`}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-petrol px-3.5 py-2 text-xs font-semibold text-white hover:bg-petrol-light active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 shrink-0 text-dorado-light" />
              Crear Reporte
            </Link>
          </div>
        </div>
      </div>

      {/* Barra rápida de navegación por secciones para Tablet y Celular */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        <a
          href="#servicios"
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border-soft bg-white px-4 py-2 text-xs font-semibold text-petrol shadow-2xs hover:border-dorado"
        >
          <Layers className="h-3.5 w-3.5 text-dorado" />
          Servicios ({(companyServicesRes.data ?? []).length})
        </a>
        <a
          href="#archivos"
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border-soft bg-white px-4 py-2 text-xs font-semibold text-petrol shadow-2xs hover:border-dorado"
        >
          <FolderLock className="h-3.5 w-3.5 text-dorado" />
          Archivos ({(filesRes.data ?? []).length})
        </a>
        <a
          href="#cotizaciones"
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border-soft bg-white px-4 py-2 text-xs font-semibold text-petrol shadow-2xs hover:border-dorado"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-dorado" />
          Cotizaciones ({(quotesRes.data ?? []).length})
        </a>
        <a
          href="#reportes"
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border-soft bg-white px-4 py-2 text-xs font-semibold text-petrol shadow-2xs hover:border-dorado"
        >
          <ClipboardCheck className="h-3.5 w-3.5 text-emerald-700" />
          Reportes ({(reportsRes.data ?? []).length})
        </a>
      </div>

      {/* Edición rápida de datos de la empresa */}
      <details className="rounded-2xl border border-border-soft bg-white shadow-2xs">
        <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 text-xs sm:text-sm font-semibold text-petrol">
          <span className="inline-flex items-center gap-2">
            <Settings2 className="h-4 w-4 shrink-0 text-dorado" />
            <span>Editar Información Técnica y de Contacto de {company.name}</span>
          </span>
          <ChevronDown className="details-chevron h-4 w-4 shrink-0 text-dorado-dark transition-transform" />
        </summary>
        <form
          action={updateWithId}
          className="border-t border-border-soft p-5 space-y-4 bg-bone-white/40"
        >
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-premium">
                Razón Social
              </label>
              <input
                name="name"
                defaultValue={company.name}
                required
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-premium">
                NIT
              </label>
              <input
                name="nit"
                defaultValue={company.nit}
                required
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Estado
              </label>
              <select
                name="status"
                defaultValue={company.status}
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
              >
                <option value="activo">Cliente Activo</option>
                <option value="prospecto">Prospecto</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-premium">
                ARL
              </label>
              <select
                name="arl"
                defaultValue={company.arl ?? ""}
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
              >
                <option value="">Sin especificar</option>
                {ARL_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Clase de Riesgo
              </label>
              <select
                name="risk_level"
                defaultValue={company.risk_level}
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
              >
                <option value="I">I</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
                <option value="V">V</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Nº Colaboradores
              </label>
              <input
                name="employee_count"
                type="number"
                min={1}
                defaultValue={company.employee_count}
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Sector
              </label>
              <input
                name="sector"
                defaultValue={company.sector ?? ""}
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Contacto Principal
              </label>
              <input
                name="contact_name"
                defaultValue={company.contact_name}
                required
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Cargo Contacto
              </label>
              <input
                name="contact_role"
                defaultValue={company.contact_role ?? ""}
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Email Contacto
              </label>
              <input
                name="contact_email"
                type="email"
                defaultValue={company.contact_email}
                required
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Teléfono / WhatsApp
              </label>
              <input
                name="contact_phone"
                defaultValue={company.contact_phone ?? ""}
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Ciudad
              </label>
              <input
                name="city"
                defaultValue={company.city}
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-gray-premium">
                Notas Internas
              </label>
              <input
                name="notes"
                defaultValue={company.notes ?? ""}
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="min-h-11 w-full sm:w-auto rounded-xl bg-petrol px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-petrol-light cursor-pointer"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </details>

      {/* Sección 1: Servicios Contratados */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div
          id="servicios"
          className="scroll-mt-20 xl:col-span-5 rounded-2xl border border-border-soft bg-white p-5 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-border-soft pb-3">
            <h2 className="text-base font-bold text-petrol">
              Servicios Activos del Cliente
            </h2>
          </div>

          {(companyServicesRes.data ?? []).length === 0 ? (
            <p className="text-xs text-gray-soft py-3">
              Esta empresa aún no tiene servicios asignados. Asígnalos abajo.
            </p>
          ) : (
            <ul className="space-y-3">
              {(companyServicesRes.data ?? []).map((cs) => {
                const srv = Array.isArray(cs.services)
                  ? cs.services[0]
                  : cs.services;
                const pillar = (srv?.pillar ?? "sg_sst") as ExtendedPillar;
                return (
                  <li
                    key={cs.id}
                    className="rounded-lg border border-border-soft bg-bone-white/50 p-3.5 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PILLAR_BADGES[pillar]}`}
                        >
                          {PILLAR_LABELS[pillar]}
                        </span>
                        <p className="mt-1 text-xs font-bold text-petrol">
                          {srv?.name ?? "Servicio"}
                        </p>
                      </div>
                      {cs.agreed_price && (
                        <span className="text-xs font-bold text-petrol">
                          {formatCOP(cs.agreed_price)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-soft">
                      <span>Inicio: {formatDate(cs.start_date)}</span>
                      <span>Renovación: {formatDate(cs.renewal_date)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Mini formulario para vincular un servicio */}
          <form
            action={assignServiceToCompanyAction}
            className="border-t border-border-soft pt-4 space-y-3"
          >
            <input type="hidden" name="company_id" value={company.id} />
            <p className="text-xs font-semibold text-petrol">
              + Vincular Servicio Contratado
            </p>
            <select
              name="service_id"
              required
              className="w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-xs"
            >
              <option value="">Seleccionar del catálogo Taltum...</option>
              {(servicesCatalogRes.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.code}] {s.name} ({formatCOP(s.base_price)})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-gray-soft">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  name="start_date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="mt-0.5 w-full rounded-lg border border-border-soft px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-soft">
                  Próxima renovación
                </label>
                <input
                  type="date"
                  name="renewal_date"
                  className="mt-0.5 w-full rounded-lg border border-border-soft px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
            <input
              type="number"
              name="agreed_price"
              placeholder="Valor acordado COP (opcional)"
              className="w-full rounded-lg border border-border-soft px-3 py-1.5 text-xs"
            />
            <button
              type="submit"
              className="min-h-11 w-full rounded-xl bg-petrol px-3 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-petrol-light cursor-pointer"
            >
              Asignar Servicio
            </button>
          </form>
        </div>

        {/* Sección 2: Subida de Archivos y Documentos de esta Empresa */}
        <div id="archivos" className="scroll-mt-20 xl:col-span-7 space-y-5">
          <FileUploader
            companies={[{ id: company.id, name: company.name }]}
            defaultCompanyId={company.id}
            templates={templatesRes.data ?? []}
          />

          <div className="rounded-xl border border-border-soft bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border-soft pb-3">
              <h2 className="inline-flex items-center gap-2 text-base font-bold text-petrol">
                <FolderLock className="h-4 w-4 text-dorado" />
                Archivos de {company.name} ({(filesRes.data ?? []).length})
              </h2>
            </div>

            {(filesRes.data ?? []).length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-soft">
                Aún no hay archivos cargados para esta empresa.
              </p>
            ) : (
              <ul className="divide-y divide-border-soft/70 mt-2">
                {(filesRes.data ?? []).map((f) => (
                  <li
                    key={f.id}
                    className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-bone-warm px-2 py-0.5 text-[10px] font-semibold text-petrol">
                          {FILE_CATEGORY_LABELS[f.category as FileCategory] ??
                            f.category}
                        </span>
                        <span className="text-[11px] font-mono text-gray-soft">
                          v{f.version}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-petrol truncate">
                        {f.title}
                      </p>
                      <p className="text-[11px] text-gray-soft truncate">
                        {f.file_name} · {formatBytes(f.size_bytes)} ·{" "}
                        {formatDate(f.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <FileOpenButton storagePath={f.storage_path} />
                      <ShareLinkModal
                        compact
                        companyId={company.id}
                        companyName={company.name}
                        contactName={company.contact_name}
                        contactEmail={company.contact_email}
                        contactPhone={company.contact_phone}
                        resourceType="file"
                        resourceId={f.id}
                        resourceTitle={f.title}
                        storagePath={f.storage_path}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Sección 3: Cotizaciones y Reportes de esta Empresa */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cotizaciones */}
        <div
          id="cotizaciones"
          className="scroll-mt-20 rounded-2xl border border-border-soft bg-white p-5 shadow-2xs"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border-soft pb-3">
            <h2 className="inline-flex items-center gap-2 text-base font-bold text-petrol">
              <FileSpreadsheet className="h-4 w-4 text-dorado" />
              Cotizaciones ({(quotesRes.data ?? []).length})
            </h2>
            <Link
              href={`/cotizaciones/nueva?empresa=${company.id}`}
              className="inline-flex min-h-9 items-center rounded-lg bg-dorado/10 px-3 py-1.5 text-xs font-semibold text-dorado-dark hover:bg-dorado/20"
            >
              + Nueva
            </Link>
          </div>

          {(quotesRes.data ?? []).length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-soft">
              Sin cotizaciones registradas para este cliente.
            </p>
          ) : (
            <ul className="divide-y divide-border-soft/70 mt-2">
              {(quotesRes.data ?? []).map((q) => {
                const st =
                  QUOTE_STATUS_STYLES[q.status as QuoteStatus] ??
                  QUOTE_STATUS_STYLES.borrador;
                return (
                  <li
                    key={q.id}
                    className="py-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <Link href={`/cotizaciones/${q.id}`} className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-petrol hover:text-dorado-dark truncate">
                        <span className="font-mono text-xs text-dorado-dark mr-1.5">
                          {q.quote_number}
                        </span>
                        {q.title}
                      </p>
                      <p className="text-xs text-gray-soft">
                        {formatCOP(q.total)} · {formatDate(q.issue_date)}
                      </p>
                    </Link>
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${st.className}`}
                      >
                        {st.label}
                      </span>
                      <ShareLinkModal
                        compact
                        companyId={company.id}
                        companyName={company.name}
                        contactName={company.contact_name}
                        contactEmail={company.contact_email}
                        contactPhone={company.contact_phone}
                        resourceType="quote"
                        resourceId={q.id}
                        resourceTitle={`${q.quote_number} — ${q.title}`}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Reportes */}
        <div
          id="reportes"
          className="scroll-mt-20 rounded-2xl border border-border-soft bg-white p-5 shadow-2xs"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border-soft pb-3">
            <h2 className="inline-flex items-center gap-2 text-base font-bold text-petrol">
              <ClipboardCheck className="h-4 w-4 text-emerald-700" />
              Reportes y Actas ({(reportsRes.data ?? []).length})
            </h2>
            <Link
              href={`/reportes/nuevo?empresa=${company.id}`}
              className="inline-flex min-h-9 items-center rounded-lg bg-petrol/10 px-3 py-1.5 text-xs font-semibold text-petrol hover:bg-petrol/15"
            >
              + Nuevo
            </Link>
          </div>

          {(reportsRes.data ?? []).length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-soft">
              Sin reportes o actas emitidas para este cliente.
            </p>
          ) : (
            <ul className="divide-y divide-border-soft/70 mt-2">
              {(reportsRes.data ?? []).map((r) => {
                const st =
                  REPORT_STATUS_STYLES[r.status as ReportStatus] ??
                  REPORT_STATUS_STYLES.borrador;
                return (
                  <li
                    key={r.id}
                    className="py-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <Link href={`/reportes/${r.id}`} className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-petrol hover:text-dorado-dark truncate">
                        <span className="font-mono text-xs text-dorado-dark mr-1.5">
                          {r.report_code}
                        </span>
                        {r.title}
                      </p>
                      <p className="text-xs text-gray-soft">
                        Visita: {formatDate(r.visit_date)}
                        {r.compliance_score !== null
                          ? ` · Cumplimiento: ${r.compliance_score}%`
                          : ""}
                      </p>
                    </Link>
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${st.className}`}
                      >
                        {st.label}
                      </span>
                      <ShareLinkModal
                        compact
                        companyId={company.id}
                        companyName={company.name}
                        contactName={company.contact_name}
                        contactEmail={company.contact_email}
                        contactPhone={company.contact_phone}
                        resourceType="report"
                        resourceId={r.id}
                        resourceTitle={`${r.report_code} — ${r.title}`}
                        storagePath={r.attachment_path}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
