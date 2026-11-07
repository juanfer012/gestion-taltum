import Link from "next/link";
import { ClipboardCheck, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  PILLAR_BADGES,
  PILLAR_LABELS,
  REPORT_STATUS_STYLES,
  formatDate,
} from "@/lib/format";
import { ShareLinkModal } from "@/components/share-link-modal";
import type { ExtendedPillar, ReportStatus } from "@/lib/types";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ pilar?: string }>;
}) {
  const params = await searchParams;
  const pillarFilter = params.pilar ?? "todos";
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select(
      "*, companies(id, name, nit, contact_name, contact_email, contact_phone), templates(code, version)"
    )
    .order("visit_date", { ascending: false });

  const allReports = reports ?? [];
  const list =
    pillarFilter === "todos"
      ? allReports
      : allReports.filter((r) => r.pillar === pillarFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-petrol">
            Reportes Técnicos, Diagnósticos y Actas
          </h1>
          <p className="text-sm text-gray-soft">
            Informes estructurados sobre formatos establecidos de Taltum con
            exportación PDF y entrega por enlace.
          </p>
        </div>
        <Link
          href="/reportes/nuevo"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-petrol px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-petrol-light active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 text-dorado-light" />
          Nuevo Reporte
        </Link>
      </div>

      {/* Píldoras de filtro por pilar para Tablet y Celular */}
      {allReports.length > 0 && (
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5">
          {[
            { value: "todos", label: `Todos (${allReports.length})` },
            { value: "sg_sst", label: "SG-SST" },
            { value: "gestion_humana", label: "Gestión Humana" },
            { value: "fisioterapia", label: "Fisioterapia" },
          ].map((pill) => {
            const active = pillarFilter === pill.value;
            const href =
              pill.value === "todos"
                ? "/reportes"
                : `/reportes?pilar=${pill.value}`;
            return (
              <Link
                key={pill.value}
                href={href}
                className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-petrol bg-petrol text-white"
                    : "border-border-soft bg-white text-gray-premium hover:border-dorado"
                }`}
              >
                {pill.label}
              </Link>
            );
          })}
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-border-soft bg-white p-10 sm:p-12 text-center">
          <ClipboardCheck className="mx-auto h-10 w-10 text-gray-soft/50" />
          <h3 className="mt-3 text-base font-bold text-petrol">
            No hay reportes en esta vista
          </h3>
          <p className="mt-1 text-xs text-gray-soft">
            Emite informes de visita SST, evaluaciones ergonómicas o diagnósticos
            de clima organizacional.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {list.map((rep) => {
            const st =
              REPORT_STATUS_STYLES[rep.status as ReportStatus] ??
              REPORT_STATUS_STYLES.borrador;
            const pillar = rep.pillar as ExtendedPillar;
            const comp = Array.isArray(rep.companies)
              ? rep.companies[0]
              : rep.companies;
            const tpl = Array.isArray(rep.templates)
              ? rep.templates[0]
              : rep.templates;

            return (
              <div
                key={rep.id}
                className="flex flex-col justify-between rounded-2xl border border-border-soft bg-white p-5 shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-dorado-dark">
                        {rep.report_code}
                      </span>
                      {tpl && (
                        <span className="rounded bg-bone-warm px-2 py-0.5 font-mono text-[10px] font-semibold text-petrol">
                          {tpl.code} v{tpl.version}
                        </span>
                      )}
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${st.className}`}
                    >
                      {st.label}
                    </span>
                  </div>

                  <Link
                    href={`/reportes/${rep.id}`}
                    className="block text-base font-bold text-petrol hover:text-dorado-dark"
                  >
                    {rep.title}
                  </Link>

                  <p className="text-xs text-gray-soft">
                    Empresa: <strong className="text-petrol">{comp?.name}</strong>{" "}
                    · Fecha: {formatDate(rep.visit_date)}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${PILLAR_BADGES[pillar]}`}
                    >
                      {PILLAR_LABELS[pillar]}
                    </span>
                    {rep.compliance_score !== null && (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        Cumplimiento: {rep.compliance_score}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-border-soft pt-3 flex items-center justify-between gap-2">
                  <Link
                    href={`/reportes/${rep.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border-soft px-3.5 py-2 text-xs font-semibold text-petrol hover:bg-bone-warm"
                  >
                    Abrir Informe / PDF
                  </Link>
                  {comp && (
                    <ShareLinkModal
                      compact
                      companyId={comp.id}
                      companyName={comp.name}
                      contactName={comp.contact_name}
                      contactEmail={comp.contact_email}
                      contactPhone={comp.contact_phone}
                      resourceType="report"
                      resourceId={rep.id}
                      resourceTitle={`${rep.report_code} — ${rep.title}`}
                      storagePath={rep.attachment_path}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
