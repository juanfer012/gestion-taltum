import Link from "next/link";
import { FileSpreadsheet, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QUOTE_STATUS_STYLES, formatCOP, formatDate } from "@/lib/format";
import { ShareLinkModal } from "@/components/share-link-modal";
import type { QuoteStatus } from "@/lib/types";

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.estado ?? "todas";
  const supabase = await createClient();

  const { data: quotes } = await supabase
    .from("quotes")
    .select(
      "*, companies(id, name, nit, contact_name, contact_email, contact_phone)"
    )
    .order("created_at", { ascending: false });

  const allQuotes = quotes ?? [];
  const list =
    statusFilter === "todas"
      ? allQuotes
      : allQuotes.filter((q) => q.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-petrol">Cotizaciones</h1>
          <p className="text-sm text-gray-soft">
            Propuestas técnico-económicas con membrete oficial, PDF imprimible y
            aprobación por link.
          </p>
        </div>
        <Link
          href="/cotizaciones/nueva"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dorado px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-dorado-dark active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nueva Cotización
        </Link>
      </div>

      {/* Filtros rápidos táctiles por estado */}
      {allQuotes.length > 0 && (
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5">
          {[
            { value: "todas", label: `Todas (${allQuotes.length})` },
            { value: "borrador", label: "Borrador" },
            { value: "enviada", label: "Enviadas" },
            { value: "aprobada", label: "Aprobadas" },
            { value: "rechazada", label: "Rechazadas" },
          ].map((pill) => {
            const active = statusFilter === pill.value;
            const href =
              pill.value === "todas"
                ? "/cotizaciones"
                : `/cotizaciones?estado=${pill.value}`;
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
          <FileSpreadsheet className="mx-auto h-10 w-10 text-gray-soft/50" />
          <h3 className="mt-3 text-base font-bold text-petrol">
            No hay cotizaciones en esta vista
          </h3>
          <p className="mt-1 text-xs text-gray-soft">
            Crea una propuesta seleccionando una empresa cliente y los servicios
            del portafolio Taltum.
          </p>
        </div>
      ) : (
        <>
          {/* VISTA CELULAR Y TABLET VERTICAL (< 1024px): Tarjetas táctiles sin scroll horizontal */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
            {list.map((q) => {
              const st =
                QUOTE_STATUS_STYLES[q.status as QuoteStatus] ??
                QUOTE_STATUS_STYLES.borrador;
              const comp = Array.isArray(q.companies)
                ? q.companies[0]
                : q.companies;

              return (
                <div
                  key={q.id}
                  className="flex flex-col justify-between rounded-2xl border border-border-soft bg-white p-5 shadow-2xs space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-dorado-dark">
                        {q.quote_number}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${st.className}`}
                      >
                        {st.label}
                      </span>
                    </div>

                    <Link
                      href={`/cotizaciones/${q.id}`}
                      className="block text-base font-bold text-petrol hover:text-dorado-dark"
                    >
                      {comp?.name ?? "Empresa"}
                    </Link>

                    <p className="text-xs text-gray-soft line-clamp-2">
                      {q.title}
                    </p>
                  </div>

                  <div className="border-t border-border-soft pt-3 space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-gray-soft">
                        Emitida: {formatDate(q.issue_date)}
                      </span>
                      <span className="text-base font-bold text-petrol">
                        {formatCOP(q.total)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/cotizaciones/${q.id}`}
                        className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-border-soft px-3 py-2 text-xs font-semibold text-petrol hover:bg-bone-warm"
                      >
                        Ver / PDF
                      </Link>
                      {comp && (
                        <ShareLinkModal
                          compact
                          companyId={comp.id}
                          companyName={comp.name}
                          contactName={comp.contact_name}
                          contactEmail={comp.contact_email}
                          contactPhone={comp.contact_phone}
                          resourceType="quote"
                          resourceId={q.id}
                          resourceTitle={`${q.quote_number} — ${q.title}`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISTA TABLET HORIZONTAL (>= 1024px) Y ESCRITORIO: Tabla Ejecutiva */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-border-soft bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-soft text-sm">
                <thead className="bg-bone-warm/60 text-left text-xs font-semibold uppercase tracking-wider text-gray-soft">
                  <tr>
                    <th className="px-4 py-3.5">Número</th>
                    <th className="px-4 py-3.5">Empresa / Propuesta</th>
                    <th className="px-4 py-3.5">Emisión</th>
                    <th className="px-4 py-3.5">Total</th>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-4 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft/70">
                  {list.map((q) => {
                    const st =
                      QUOTE_STATUS_STYLES[q.status as QuoteStatus] ??
                      QUOTE_STATUS_STYLES.borrador;
                    const comp = Array.isArray(q.companies)
                      ? q.companies[0]
                      : q.companies;

                    return (
                      <tr key={q.id} className="hover:bg-bone-white/50">
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-dorado-dark whitespace-nowrap">
                          <Link href={`/cotizaciones/${q.id}`}>
                            {q.quote_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/cotizaciones/${q.id}`}
                            className="font-semibold text-petrol hover:text-dorado-dark block"
                          >
                            {comp?.name ?? "Empresa"}
                          </Link>
                          <span className="text-xs text-gray-soft line-clamp-1">
                            {q.title}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-soft whitespace-nowrap">
                          {formatDate(q.issue_date)}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-petrol whitespace-nowrap">
                          {formatCOP(q.total)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${st.className}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/cotizaciones/${q.id}`}
                              className="inline-flex min-h-10 items-center rounded-xl border border-border-soft px-3 py-2 text-xs font-semibold text-petrol hover:bg-bone-warm"
                            >
                              Ver / PDF
                            </Link>
                            {comp && (
                              <ShareLinkModal
                                compact
                                companyId={comp.id}
                                companyName={comp.name}
                                contactName={comp.contact_name}
                                contactEmail={comp.contact_email}
                                contactPhone={comp.contact_phone}
                                resourceType="quote"
                                resourceId={q.id}
                                resourceTitle={`${q.quote_number} — ${q.title}`}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
