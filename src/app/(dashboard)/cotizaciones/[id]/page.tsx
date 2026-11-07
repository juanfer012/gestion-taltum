import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateQuoteStatusAction } from "@/app/actions";
import {
  PILLAR_LABELS,
  QUOTE_STATUS_STYLES,
  formatCOP,
  formatDate,
} from "@/lib/format";
import { TaltumLogo } from "@/components/taltum-logo";
import { PrintButton } from "@/components/print-button";
import { ShareLinkModal } from "@/components/share-link-modal";
import type { ExtendedPillar, QuoteStatus } from "@/lib/types";

export default async function CotizacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select(
      "*, companies(id, name, nit, city, contact_name, contact_role, contact_email, contact_phone), templates(code, version, name), quote_items(*)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!quote) {
    notFound();
  }

  const company = Array.isArray(quote.companies)
    ? quote.companies[0]
    : quote.companies;
  const template = Array.isArray(quote.templates)
    ? quote.templates[0]
    : quote.templates;
  const items = [...(quote.quote_items ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  const statusStyle =
    QUOTE_STATUS_STYLES[quote.status as QuoteStatus] ??
    QUOTE_STATUS_STYLES.borrador;

  const subtotal = Number(quote.subtotal ?? 0);
  const discountPct = Number(quote.discount_percent ?? 0);
  const discountVal = Math.round(subtotal * (discountPct / 100));
  const taxable = subtotal - discountVal;
  const taxPct = Number(quote.tax_percent ?? 0);
  const taxVal = Math.round(taxable * (taxPct / 100));

  const markSent = updateQuoteStatusAction.bind(null, quote.id, "enviada");
  const markApproved = updateQuoteStatusAction.bind(null, quote.id, "aprobada");
  const markRejected = updateQuoteStatusAction.bind(null, quote.id, "rechazada");

  return (
    <div className="space-y-6">
      {/* Barra de control superior (No se imprime) */}
      <div className="no-print flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/cotizaciones"
            className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-gray-soft hover:text-petrol"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Cotizaciones
          </Link>
          <span
            className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${statusStyle.className}`}
          >
            Estado: {statusStyle.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {quote.status === "borrador" && (
            <form action={markSent}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-100 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                Marcar Enviada
              </button>
            </form>
          )}
          {quote.status !== "aprobada" && (
            <form action={markApproved}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Aprobada
              </button>
            </form>
          )}
          {quote.status !== "rechazada" && (
            <form action={markRejected}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                Rechazada
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
              resourceType="quote"
              resourceId={quote.id}
              resourceTitle={`${quote.quote_number} — ${quote.title}`}
            />
          )}
        </div>
      </div>

      {/* Hoja Membretada Corporativa A4 */}
      <article className="print-sheet mx-auto max-w-4xl rounded-2xl border border-border-soft bg-white p-4 sm:p-8 lg:p-12 shadow-xs space-y-6 sm:space-y-8">
        {/* Encabezado con cajetín de formato controlado */}
        <div className="flex flex-col gap-6 border-b-2 border-petrol pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <TaltumLogo variant="dark" />
            <p className="mt-2 text-xs text-gray-soft">
              Medellín, Colombia · contacto@taltum.co · +57 333 431 7534
            </p>
          </div>

          <div className="rounded-lg border border-border-soft bg-bone-white p-3.5 text-xs space-y-1 sm:text-right">
            <div className="font-mono font-bold text-petrol text-sm">
              {quote.quote_number}
            </div>
            <div className="text-gray-soft">
              Formato:{" "}
              <strong className="font-mono text-petrol">
                {template ? `${template.code} v${template.version}` : "FT-COM-001 v2.0"}
              </strong>
            </div>
            <div className="text-gray-soft">
              Emisión: <strong className="text-petrol">{formatDate(quote.issue_date)}</strong>
            </div>
            {quote.valid_until && (
              <div className="text-gray-soft">
                Vigencia:{" "}
                <strong className="text-petrol">{formatDate(quote.valid_until)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Destinatario y Título */}
        <div className="grid grid-cols-1 gap-4 rounded-xl bg-bone-white p-5 sm:grid-cols-2 text-xs">
          <div>
            <span className="uppercase tracking-wider font-semibold text-dorado-dark">
              Preparado para
            </span>
            <p className="mt-1 text-base font-bold text-petrol">
              {company?.name}
            </p>
            <p className="text-gray-premium">
              NIT: {company?.nit} · {company?.city}
            </p>
          </div>
          <div>
            <span className="uppercase tracking-wider font-semibold text-dorado-dark">
              Atención
            </span>
            <p className="mt-1 text-sm font-semibold text-petrol">
              {company?.contact_name}
              {company?.contact_role ? ` — ${company.contact_role}` : ""}
            </p>
            <p className="text-gray-premium">{company?.contact_email}</p>
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-petrol">{quote.title}</h1>
          {quote.intro_text && (
            <p className="mt-2 text-sm leading-relaxed text-gray-premium whitespace-pre-line">
              {quote.intro_text}
            </p>
          )}
        </div>

        {/* Ítems en tarjetas para Celular (ocultas en Tablet, Desktop y PDF) */}
        <div className="space-y-3 sm:hidden print:hidden">
          {items.map((it) => (
            <div
              key={it.id}
              className="rounded-xl border border-border-soft bg-bone-white/50 p-3.5 space-y-2"
            >
              {it.pillar && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-dorado-dark block">
                  {PILLAR_LABELS[it.pillar as ExtendedPillar] ?? it.pillar}
                </span>
              )}
              <p className="text-sm font-bold text-petrol">{it.description}</p>
              {it.details && (
                <p className="text-xs text-gray-soft">{it.details}</p>
              )}
              <div className="flex items-center justify-between border-t border-border-soft pt-2 text-xs">
                <span className="text-gray-premium">
                  {it.quantity} {it.unit} × {formatCOP(it.unit_price)}
                </span>
                <span className="font-bold text-petrol">
                  {formatCOP(it.line_total)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla de ítems para Tablet, Escritorio e Impresión PDF */}
        <div className="hidden sm:block print:block overflow-hidden rounded-xl border border-border-soft">
          <table className="min-w-full divide-y divide-border-soft text-sm">
            <thead className="bg-petrol text-white text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Descripción del Servicio / Alcance</th>
                <th className="px-3 py-3 text-center">Cant.</th>
                <th className="px-4 py-3 text-right">Vr. Unitario</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="px-4 py-3.5">
                    {it.pillar && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-dorado-dark block">
                        {PILLAR_LABELS[it.pillar as ExtendedPillar] ?? it.pillar}
                      </span>
                    )}
                    <div className="font-semibold text-petrol">
                      {it.description}
                    </div>
                    {it.details && (
                      <p className="mt-0.5 text-xs text-gray-soft">
                        {it.details}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-center text-xs text-gray-premium whitespace-nowrap">
                    {it.quantity} {it.unit}
                  </td>
                  <td className="px-4 py-3.5 text-right text-xs text-gray-premium whitespace-nowrap">
                    {formatCOP(it.unit_price)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-petrol whitespace-nowrap">
                    {formatCOP(it.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen Financiero y Condiciones */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-12 items-start">
          <div className="sm:col-span-7 space-y-3 text-xs text-gray-premium">
            {quote.terms_text && (
              <div>
                <h3 className="font-bold uppercase tracking-wider text-petrol">
                  Condiciones Comerciales
                </h3>
                <p className="mt-1 leading-relaxed whitespace-pre-line">
                  {quote.terms_text}
                </p>
              </div>
            )}
            {quote.notes && (
              <div>
                <h3 className="font-bold uppercase tracking-wider text-petrol">
                  Notas
                </h3>
                <p className="mt-1 leading-relaxed">{quote.notes}</p>
              </div>
            )}
          </div>

          <div className="sm:col-span-5 rounded-xl border border-border-soft bg-bone-white p-4 space-y-2 text-sm">
            <div className="flex justify-between text-xs text-gray-premium">
              <span>Subtotal</span>
              <span className="font-semibold text-petrol">
                {formatCOP(subtotal)}
              </span>
            </div>
            {discountPct > 0 && (
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Descuento ({discountPct}%)</span>
                <span>- {formatCOP(discountVal)}</span>
              </div>
            )}
            {taxPct > 0 && (
              <div className="flex justify-between text-xs text-gray-premium">
                <span>IVA ({taxPct}%)</span>
                <span>{formatCOP(taxVal)}</span>
              </div>
            )}
            <div className="border-t border-border-soft pt-2.5 flex justify-between items-baseline">
              <span className="font-bold text-petrol">Total Inversión</span>
              <span className="text-lg font-bold text-petrol">
                {formatCOP(quote.total)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-border-soft pt-5 text-center text-[11px] text-gray-soft">
          Taltum · Consultoría Integral en Seguridad y Salud en el Trabajo,
          Gestión Humana y Fisioterapia Especializada · https://taltum.co
        </div>
      </article>
    </div>
  );
}
