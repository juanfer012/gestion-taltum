import { headers } from "next/headers";
import {
  Download,
  FileText,
  Lock,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  FILE_CATEGORY_LABELS,
  PILLAR_LABELS,
  formatBytes,
  formatCOP,
  formatDate,
} from "@/lib/format";
import { TaltumLogo } from "@/components/taltum-logo";
import { PrintButton } from "@/components/print-button";
import { PublicQuoteDecision } from "@/components/public-quote-decision";
import type { ExtendedPillar, FileCategory } from "@/lib/types";

interface SharedPayload {
  share: {
    label: string | null;
    recipient_name: string | null;
    resource_type: "file" | "report" | "quote";
    allow_download: boolean;
    expires_at: string | null;
    created_at: string;
  };
  company: {
    name: string;
    nit: string;
    city: string;
    contact_name: string;
  };
  resource: Record<string, unknown>;
}

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const reqHeaders = await headers();
  const userAgent = reqHeaders.get("user-agent") ?? "browser";

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_shared_resource", {
    p_token: token,
    p_user_agent: userAgent,
  });

  const payload = (data ?? null) as SharedPayload | null;

  if (!payload) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-bone-white">
        <header className="border-b border-white/10 bg-petrol px-6 py-4">
          <div className="mx-auto max-w-4xl">
            <TaltumLogo variant="light" />
          </div>
        </header>

        <main className="mx-auto max-w-md px-6 py-16 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-petrol/10 text-petrol">
            <Lock className="h-7 w-7 text-dorado" />
          </div>
          <h1 className="text-xl font-bold text-petrol">
            Enlace expirado o revocado
          </h1>
          <p className="text-sm text-gray-soft leading-relaxed">
            Por políticas de confidencialidad y seguridad documental de Taltum,
            este enlace ya no se encuentra disponible. Solicita un nuevo enlace a
            tu consultor asignado.
          </p>
          <a
            href="https://wa.me/573334317534?text=%C2%A1Hola%20equipo%20Taltum!%20Necesito%20actualizar%20un%20enlace%20de%20documento%20compartido."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-petrol px-5 py-2.5 text-sm font-semibold text-white hover:bg-petrol-light"
          >
            <MessageCircle className="h-4 w-4 text-dorado-light" />
            Contactar a Taltum por WhatsApp
          </a>
        </main>

        <footer className="py-6 text-center text-xs text-gray-soft">
          © {new Date().getFullYear()} Taltum.co · Medellín, Colombia
        </footer>
      </div>
    );
  }

  const { share, company, resource } = payload;

  return (
    <div className="min-h-screen flex flex-col bg-bone-white">
      {/* Encabezado Corporativo Público */}
      <header className="no-print border-b border-white/10 bg-petrol px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <TaltumLogo variant="light" />

          <div className="flex items-center gap-3 text-xs text-white/80">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-dorado/40 bg-dorado/15 px-3 py-1 font-medium text-dorado-light">
              <ShieldCheck className="h-3.5 w-3.5" />
              Entrega Confidencial Verificada
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8 space-y-6">
        {/* Barra de bienvenida al destinatario */}
        <div className="no-print flex flex-col gap-4 rounded-2xl border border-border-soft bg-white p-4 sm:p-5 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-dorado-dark">
              Documento compartido para {company.name} (NIT {company.nit})
            </p>
            <p className="mt-0.5 text-sm text-gray-premium">
              {share.recipient_name
                ? `Atención: ${share.recipient_name}`
                : `Atención: ${company.contact_name}`}
              {share.expires_at
                ? ` · Enlace disponible hasta el ${formatDate(share.expires_at)}`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {share.resource_type !== "file" && <PrintButton />}
            {share.resource_type === "quote" && (
              <PublicQuoteDecision
                token={token}
                currentStatus={String(resource.status ?? "enviada")}
              />
            )}
            <a
              href="https://wa.me/573334317534"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border-soft bg-bone-white px-3.5 py-2 text-xs font-semibold text-petrol hover:bg-bone-warm"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              Consultar a Taltum
            </a>
          </div>
        </div>

        {/* VISTA 1: ARCHIVO DOCUMENTAL */}
        {share.resource_type === "file" && (
          <div className="rounded-2xl border border-border-soft bg-white p-5 sm:p-10 shadow-xs space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-border-soft pb-6">
              <div className="flex items-start gap-3.5">
                <div className="rounded-xl bg-petrol p-3 text-dorado-light shrink-0">
                  <FileText className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0">
                  <span className="rounded bg-bone-warm px-2.5 py-0.5 text-xs font-semibold text-petrol">
                    {FILE_CATEGORY_LABELS[
                      String(resource.category) as FileCategory
                    ] ?? String(resource.category)}
                  </span>
                  <h1 className="mt-2 text-lg sm:text-2xl font-bold text-petrol break-words">
                    {String(resource.title)}
                  </h1>
                  <p className="mt-1 text-xs text-gray-soft break-words">
                    Archivo: {String(resource.file_name)} · Versión{" "}
                    {String(resource.version ?? "1.0")} ·{" "}
                    {formatBytes(Number(resource.size_bytes ?? 0))} · Emitido el{" "}
                    {formatDate(String(resource.created_at))}
                  </p>
                </div>
              </div>

              {Boolean(resource.signed_url) && (
                <a
                  href={String(resource.signed_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-dorado px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-dorado-dark"
                >
                  <Download className="h-4 w-4" />
                  Descargar Documento
                </a>
              )}
            </div>

            {Boolean(resource.description) && (
              <p className="text-sm text-gray-premium leading-relaxed">
                {String(resource.description)}
              </p>
            )}

            {String(resource.mime_type) === "application/pdf" &&
              Boolean(resource.signed_url) && (
                <div className="overflow-hidden rounded-xl border border-border-soft bg-bone-warm">
                  <iframe
                    src={String(resource.signed_url)}
                    title={String(resource.title)}
                    className="h-[62dvh] sm:h-[74dvh] w-full"
                  />
                </div>
              )}
          </div>
        )}

        {/* VISTA 2: REPORTE TÉCNICO */}
        {share.resource_type === "report" && (
          <article className="print-sheet rounded-2xl border border-border-soft bg-white p-4 sm:p-8 lg:p-12 shadow-xs space-y-6 sm:space-y-7">
            <div className="flex flex-col gap-4 border-b-2 border-petrol pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <TaltumLogo variant="dark" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-dorado-dark">
                  {PILLAR_LABELS[String(resource.pillar) as ExtendedPillar] ??
                    String(resource.pillar)}
                </p>
              </div>
              <div className="rounded-lg border border-border-soft bg-bone-white p-3.5 text-xs space-y-1 sm:text-right">
                <div className="font-mono font-bold text-petrol text-sm">
                  {String(resource.report_code)}
                </div>
                {Boolean(resource.template) && (
                  <div className="text-gray-soft">
                    Formato:{" "}
                    <strong className="font-mono text-petrol">
                      {(resource.template as { code: string; version: string }).code} · v
                      {(resource.template as { code: string; version: string }).version}
                    </strong>
                  </div>
                )}
                <div className="text-gray-soft">
                  Fecha:{" "}
                  <strong className="text-petrol">
                    {formatDate(String(resource.visit_date))}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-bone-white p-4 text-xs">
              <div>
                <span className="font-semibold text-gray-soft uppercase">
                  Organización:
                </span>{" "}
                <strong className="text-petrol">
                  {company.name} (NIT {company.nit})
                </strong>
              </div>
              {resource.compliance_score !== null &&
                resource.compliance_score !== undefined && (
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 font-bold text-emerald-800">
                    Cumplimiento Evaluado: {String(resource.compliance_score)}%
                  </span>
                )}
            </div>

            <h1 className="text-xl font-bold text-petrol">
              {String(resource.title)}
            </h1>

            {Boolean(resource.summary) && (
              <section className="space-y-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-dorado-dark">
                  1. Objetivo y Resumen Ejecutivo
                </h2>
                <p className="text-sm leading-relaxed text-gray-premium whitespace-pre-line">
                  {String(resource.summary)}
                </p>
              </section>
            )}

            {Boolean(resource.findings) && (
              <section className="space-y-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-dorado-dark">
                  2. Hallazgos Técnicos
                </h2>
                <div className="rounded-xl border border-border-soft bg-bone-white/50 p-4 text-sm leading-relaxed text-gray-premium whitespace-pre-line">
                  {String(resource.findings)}
                </div>
              </section>
            )}

            {Boolean(resource.recommendations) && (
              <section className="space-y-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-dorado-dark">
                  3. Plan de Acción y Recomendaciones
                </h2>
                <div className="rounded-xl border border-petrol/15 bg-petrol/[0.03] p-4 text-sm leading-relaxed text-petrol whitespace-pre-line">
                  {String(resource.recommendations)}
                </div>
              </section>
            )}

            {Boolean(resource.signed_url) && (
              <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border-soft bg-bone-white p-4">
                <span className="text-xs font-semibold text-petrol truncate">
                  Soporte adjunto:{" "}
                  {String(resource.attachment_name ?? "Descargar anexo")}
                </span>
                <a
                  href={String(resource.signed_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-petrol px-4 py-2 text-xs font-semibold text-white hover:bg-petrol-light"
                >
                  <Download className="h-3.5 w-3.5 text-dorado-light" />
                  Descargar Anexo
                </a>
              </div>
            )}
          </article>
        )}

        {/* VISTA 3: COTIZACIÓN CORPORATIVA */}
        {share.resource_type === "quote" && (
          <article className="print-sheet rounded-2xl border border-border-soft bg-white p-4 sm:p-8 lg:p-12 shadow-xs space-y-6 sm:space-y-8">
            <div className="flex flex-col gap-5 border-b-2 border-petrol pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <TaltumLogo variant="dark" />
                <p className="mt-2 text-xs text-gray-soft">
                  Medellín, Colombia · contacto@taltum.co · +57 333 431 7534
                </p>
              </div>
              <div className="rounded-lg border border-border-soft bg-bone-white p-3.5 text-xs space-y-1 sm:text-right">
                <div className="font-mono font-bold text-petrol text-sm">
                  {String(resource.quote_number)}
                </div>
                <div className="text-gray-soft">
                  Emisión:{" "}
                  <strong className="text-petrol">
                    {formatDate(String(resource.issue_date))}
                  </strong>
                </div>
                {Boolean(resource.valid_until) && (
                  <div className="text-gray-soft">
                    Válida hasta:{" "}
                    <strong className="text-petrol">
                      {formatDate(String(resource.valid_until))}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold text-petrol">
                {String(resource.title)}
              </h1>
              {Boolean(resource.intro_text) && (
                <p className="mt-2 text-sm leading-relaxed text-gray-premium whitespace-pre-line">
                  {String(resource.intro_text)}
                </p>
              )}
            </div>

            {/* Tarjetas de ítems en Celular */}
            <div className="space-y-3 sm:hidden print:hidden">
              {((resource.items as Array<Record<string, unknown>>) ?? []).map(
                (it, idx) => (
                  <div
                    key={String(it.id ?? idx)}
                    className="rounded-xl border border-border-soft bg-bone-white/50 p-3.5 space-y-2"
                  >
                    {Boolean(it.pillar) && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-dorado-dark block">
                        {PILLAR_LABELS[String(it.pillar) as ExtendedPillar] ??
                          String(it.pillar)}
                      </span>
                    )}
                    <p className="text-sm font-bold text-petrol">
                      {String(it.description)}
                    </p>
                    {Boolean(it.details) && (
                      <p className="text-xs text-gray-soft">
                        {String(it.details)}
                      </p>
                    )}
                    <div className="flex items-center justify-between border-t border-border-soft pt-2 text-xs">
                      <span className="text-gray-premium">
                        {String(it.quantity)} {String(it.unit)} ×{" "}
                        {formatCOP(Number(it.unit_price ?? 0))}
                      </span>
                      <span className="font-bold text-petrol">
                        {formatCOP(Number(it.line_total ?? 0))}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Tabla de ítems para Tablet, Escritorio e Impresión PDF */}
            <div className="hidden sm:block print:block overflow-hidden rounded-xl border border-border-soft">
              <table className="min-w-full divide-y divide-border-soft text-sm">
                <thead className="bg-petrol text-white text-left text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Descripción del Servicio</th>
                    <th className="px-3 py-3 text-center">Cant.</th>
                    <th className="px-4 py-3 text-right">Vr. Unitario</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {((resource.items as Array<Record<string, unknown>>) ?? []).map(
                    (it, idx) => (
                      <tr key={String(it.id ?? idx)}>
                        <td className="px-4 py-3.5">
                          {Boolean(it.pillar) && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-dorado-dark block">
                              {PILLAR_LABELS[
                                String(it.pillar) as ExtendedPillar
                              ] ?? String(it.pillar)}
                            </span>
                          )}
                          <div className="font-semibold text-petrol">
                            {String(it.description)}
                          </div>
                          {Boolean(it.details) && (
                            <p className="mt-0.5 text-xs text-gray-soft">
                              {String(it.details)}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-center text-xs text-gray-premium whitespace-nowrap">
                          {String(it.quantity)} {String(it.unit)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-gray-premium whitespace-nowrap">
                          {formatCOP(Number(it.unit_price ?? 0))}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-petrol whitespace-nowrap">
                          {formatCOP(Number(it.line_total ?? 0))}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-12 items-start">
              <div className="sm:col-span-7 space-y-3 text-xs text-gray-premium">
                {Boolean(resource.terms_text) && (
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-petrol">
                      Condiciones Comerciales
                    </h3>
                    <p className="mt-1 leading-relaxed whitespace-pre-line">
                      {String(resource.terms_text)}
                    </p>
                  </div>
                )}
              </div>

              <div className="sm:col-span-5 rounded-xl border border-border-soft bg-bone-white p-4 space-y-2 text-sm">
                <div className="flex justify-between text-xs text-gray-premium">
                  <span>Subtotal</span>
                  <span className="font-semibold text-petrol">
                    {formatCOP(Number(resource.subtotal ?? 0))}
                  </span>
                </div>
                {Number(resource.discount_percent ?? 0) > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700">
                    <span>
                      Descuento ({Number(resource.discount_percent)}%)
                    </span>
                    <span>
                      -{" "}
                      {formatCOP(
                        Math.round(
                          Number(resource.subtotal ?? 0) *
                            (Number(resource.discount_percent) / 100)
                        )
                      )}
                    </span>
                  </div>
                )}
                {Number(resource.tax_percent ?? 0) > 0 && (
                  <div className="flex justify-between text-xs text-gray-premium">
                    <span>IVA ({Number(resource.tax_percent)}%)</span>
                    <span>
                      {formatCOP(
                        Math.round(
                          Number(resource.subtotal ?? 0) *
                            (1 - Number(resource.discount_percent ?? 0) / 100) *
                            (Number(resource.tax_percent) / 100)
                        )
                      )}
                    </span>
                  </div>
                )}
                <div className="border-t border-border-soft pt-2.5 flex justify-between items-baseline">
                  <span className="font-bold text-petrol">Total Inversión</span>
                  <span className="text-lg font-bold text-petrol">
                    {formatCOP(Number(resource.total ?? 0))}
                  </span>
                </div>
              </div>
            </div>
          </article>
        )}
      </main>

      <footer className="no-print border-t border-border-soft bg-white py-5 text-center text-xs text-gray-soft">
        Taltum · Consultoría en SST, Gestión Humana y Fisioterapia Especializada
        ·{" "}
        <a
          href="https://taltum.co"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-petrol hover:underline"
        >
          taltum.co
        </a>
      </footer>
    </div>
  );
}
