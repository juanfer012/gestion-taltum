import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateReportStatusAction } from "@/app/actions";
import {
  PILLAR_LABELS,
  REPORT_STATUS_STYLES,
  formatDate,
} from "@/lib/format";
import { TaltumLogo } from "@/components/taltum-logo";
import { PrintButton } from "@/components/print-button";
import { FileOpenButton } from "@/components/file-open-button";
import { ShareLinkModal } from "@/components/share-link-modal";
import type { ExtendedPillar, ReportStatus } from "@/lib/types";

export default async function ReporteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("reports")
    .select(
      "*, companies(id, name, nit, city, arl, risk_level, employee_count, contact_name, contact_email, contact_phone), templates(code, version, name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!report) {
    notFound();
  }

  const company = Array.isArray(report.companies)
    ? report.companies[0]
    : report.companies;
  const template = Array.isArray(report.templates)
    ? report.templates[0]
    : report.templates;
  const statusStyle =
    REPORT_STATUS_STYLES[report.status as ReportStatus] ??
    REPORT_STATUS_STYLES.borrador;

  const markFinalized = updateReportStatusAction.bind(
    null,
    report.id,
    "finalizado"
  );

  return (
    <div className="space-y-6">
      {/* Controles superiores */}
      <div className="no-print flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/reportes"
            className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-gray-soft hover:text-petrol"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Reportes
          </Link>
          <span
            className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${statusStyle.className}`}
          >
            {statusStyle.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {report.status !== "finalizado" && (
            <form action={markFinalized}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Marcar Finalizado
              </button>
            </form>
          )}

          <PrintButton />

          {company && (
            <ShareLinkModal
              companyId={company.id}
              companyName={company.name}
              contactName={company.contact_name}
              contactEmail={company.contact_email}
              contactPhone={company.contact_phone}
              resourceType="report"
              resourceId={report.id}
              resourceTitle={`${report.report_code} — ${report.title}`}
              storagePath={report.attachment_path}
            />
          )}
        </div>
      </div>

      {/* Documento Formal A4 */}
      <article className="print-sheet mx-auto max-w-4xl rounded-2xl border border-border-soft bg-white p-4 sm:p-8 lg:p-12 shadow-xs space-y-6 sm:space-y-7">
        {/* Cajetín de control documental estilo SG-SST */}
        <div className="flex flex-col gap-5 border-b-2 border-petrol pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <TaltumLogo variant="dark" />
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-dorado-dark">
              {PILLAR_LABELS[report.pillar as ExtendedPillar] ?? report.pillar}
            </p>
          </div>

          <div className="rounded-lg border border-border-soft bg-bone-white p-3.5 text-xs space-y-1 sm:text-right">
            <div className="font-mono font-bold text-petrol text-sm">
              {report.report_code}
            </div>
            <div className="text-gray-soft">
              Formato:{" "}
              <strong className="font-mono text-petrol">
                {template
                  ? `${template.code} · v${template.version}`
                  : "FT-SST-GEN · v1.0"}
              </strong>
            </div>
            <div className="text-gray-soft">
              Fecha Visita/Informe:{" "}
              <strong className="text-petrol">
                {formatDate(report.visit_date)}
              </strong>
            </div>
          </div>
        </div>

        {/* Ficha Técnica de la Empresa */}
        <div className="grid grid-cols-1 gap-4 rounded-xl bg-bone-white p-5 sm:grid-cols-3 text-xs">
          <div>
            <span className="uppercase tracking-wider font-semibold text-gray-soft">
              Organización
            </span>
            <p className="mt-0.5 text-sm font-bold text-petrol">
              {company?.name}
            </p>
            <p className="text-gray-premium">
              NIT {company?.nit} · {company?.city}
            </p>
          </div>
          <div>
            <span className="uppercase tracking-wider font-semibold text-gray-soft">
              Parámetros SST
            </span>
            <p className="mt-0.5 font-semibold text-petrol">
              Riesgo {company?.risk_level} · {company?.employee_count} colab.
            </p>
            <p className="text-gray-premium">
              ARL: {company?.arl ?? "No especificada"}
            </p>
          </div>
          <div>
            <span className="uppercase tracking-wider font-semibold text-gray-soft">
              Consultor Responsable
            </span>
            <p className="mt-0.5 font-semibold text-petrol">
              {report.author_name ?? "Equipo Consultor Taltum"}
            </p>
            {report.compliance_score !== null && (
              <p className="mt-0.5 font-bold text-emerald-700">
                Cumplimiento Evaluado: {report.compliance_score}%
              </p>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-petrol">{report.title}</h1>
        </div>

        {report.summary && (
          <section className="space-y-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-dorado-dark">
              1. Objetivo y Resumen Ejecutivo
            </h2>
            <p className="text-sm leading-relaxed text-gray-premium whitespace-pre-line">
              {report.summary}
            </p>
          </section>
        )}

        {report.findings && (
          <section className="space-y-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-dorado-dark">
              2. Hallazgos Técnicos y Observaciones
            </h2>
            <div className="rounded-xl border border-border-soft bg-bone-white/50 p-4 text-sm leading-relaxed text-gray-premium whitespace-pre-line">
              {report.findings}
            </div>
          </section>
        )}

        {report.recommendations && (
          <section className="space-y-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-dorado-dark">
              3. Plan de Acción y Recomendaciones
            </h2>
            <div className="rounded-xl border border-petrol/15 bg-petrol/[0.03] p-4 text-sm leading-relaxed text-petrol whitespace-pre-line">
              {report.recommendations}
            </div>
          </section>
        )}

        {report.attachment_path && (
          <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border-soft bg-bone-white p-4">
            <div className="flex items-center gap-2.5 text-xs min-w-0">
              <Paperclip className="h-4 w-4 shrink-0 text-dorado" />
              <span className="font-semibold text-petrol truncate">
                Anexo soporte: {report.attachment_name ?? "Archivo adjunto"}
              </span>
            </div>
            <FileOpenButton storagePath={report.attachment_path} />
          </div>
        )}

        <div className="border-t border-border-soft pt-5 text-center text-[11px] text-gray-soft">
          Informe confidencial emitido por Taltum · Medellín, Colombia ·
          contacto@taltum.co
        </div>
      </article>
    </div>
  );
}
