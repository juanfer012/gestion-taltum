"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { createQuoteAction } from "@/app/actions";
import { PILLAR_LABELS, formatCOP } from "@/lib/format";
import type {
  Company,
  DocumentTemplate,
  ExtendedPillar,
  Service,
} from "@/lib/types";

interface QuoteBuilderProps {
  companies: Array<
    Pick<Company, "id" | "name" | "nit" | "risk_level" | "employee_count">
  >;
  services: Service[];
  templates: Array<
    Pick<
      DocumentTemplate,
      "id" | "code" | "version" | "name" | "default_content"
    >
  >;
  defaultCompanyId?: string;
  suggestedNumber: string;
}

interface DraftItem {
  key: string;
  service_id: string | null;
  pillar: ExtendedPillar;
  description: string;
  details: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

export function QuoteBuilder({
  companies,
  services,
  templates,
  defaultCompanyId,
  suggestedNumber,
}: QuoteBuilderProps) {
  const router = useRouter();
  const defaultTpl = templates[0] ?? null;

  const today = new Date().toISOString().slice(0, 10);
  const in15Days = new Date(Date.now() + 15 * 86400 * 1000)
    .toISOString()
    .slice(0, 10);

  const [quoteNumber, setQuoteNumber] = useState(suggestedNumber);
  const [companyId, setCompanyId] = useState(
    defaultCompanyId ?? companies[0]?.id ?? ""
  );
  const [templateId, setTemplateId] = useState(defaultTpl?.id ?? "");
  const [title, setTitle] = useState(
    "Propuesta Integral en SG-SST, Gestión Humana y Bienestar"
  );
  const [issueDate, setIssueDate] = useState(today);
  const [validUntil, setValidUntil] = useState(in15Days);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(19);
  const [introText, setIntroText] = useState(
    defaultTpl?.default_content ??
      "Presentamos nuestra propuesta técnico-económica personalizada, diseñada para garantizar el cumplimiento legal, fortalecer el talento y proteger la salud laboral de su equipo."
  );
  const [termsText, setTermsText] = useState(
    "Forma de pago: 50% anticipo a la aprobación de la propuesta y 50% contra entrega de informes acordados (o facturación mensual vencida para igualas). Validez de la oferta: 15 días calendario."
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([
    {
      key: "init-1",
      service_id: services[0]?.id ?? null,
      pillar: services[0]?.pillar ?? "sg_sst",
      description:
        services[0]?.name ?? "Diseño e Implementación Integral de SG-SST",
      details: Array.isArray(services[0]?.deliverables)
        ? services[0].deliverables.join(" · ")
        : "Diagnóstico técnico de brechas, matriz legal y plan anual de trabajo.",
      quantity: 1,
      unit: services[0]?.billing_type === "mensual" ? "Mes" : "Servicio",
      unit_price: Number(services[0]?.base_price ?? 2800000),
    },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const addServiceFromCatalog = (serviceId: string) => {
    const srv = services.find((s) => s.id === serviceId);
    if (!srv) return;
    setItems((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${Math.random()}`,
        service_id: srv.id,
        pillar: srv.pillar,
        description: srv.name,
        details: Array.isArray(srv.deliverables)
          ? srv.deliverables.join(" · ")
          : srv.description ?? "",
        quantity: 1,
        unit: srv.billing_type === "mensual" ? "Mes" : "Servicio",
        unit_price: Number(srv.base_price),
      },
    ]);
  };

  const addBlankItem = () => {
    setItems((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${Math.random()}`,
        service_id: null,
        pillar: "transversal",
        description: "",
        details: "",
        quantity: 1,
        unit: "Servicio",
        unit_price: 0,
      },
    ]);
  };

  const updateItem = <K extends keyof DraftItem>(
    key: string,
    field: K,
    value: DraftItem[K]
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, [field]: value } : it))
    );
  };

  const removeItem = (key: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.key !== key));
  };

  const subtotal = items.reduce(
    (acc, it) =>
      acc +
      Math.round((Number(it.quantity) || 0) * (Number(it.unit_price) || 0)),
    0
  );
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const taxableBase = subtotal - discountAmount;
  const taxAmount = Math.round(taxableBase * (taxPercent / 100));
  const total = taxableBase + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyId) {
      setError("Debes seleccionar una empresa cliente.");
      return;
    }

    startTransition(async () => {
      const res = await createQuoteAction({
        quote_number: quoteNumber,
        company_id: companyId,
        template_id: templateId || null,
        title,
        issue_date: issueDate,
        valid_until: validUntil || null,
        discount_percent: discountPercent,
        tax_percent: taxPercent,
        intro_text: introText,
        terms_text: termsText,
        notes,
        items: items.map((it) => ({
          service_id: it.service_id,
          pillar: it.pillar,
          description: it.description,
          details: it.details,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unit_price,
        })),
      });

      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }

      router.push(`/cotizaciones/${res.id}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabecera documental */}
      <div className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-petrol border-b border-border-soft pb-3">
          1. Datos del Cliente y Formato Establecido
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Consecutivo Cotización *
            </label>
            <input
              required
              value={quoteNumber}
              onChange={(e) => setQuoteNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-sm font-mono uppercase"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-premium">
              Empresa Destinataria *
            </label>
            <select
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3.5 py-2.5 text-sm"
            >
              <option value="">Seleccionar empresa...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — NIT {c.nit} ({c.employee_count} colab., Riesgo{" "}
                  {c.risk_level})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Formato Controlado
            </label>
            <select
              value={templateId}
              onChange={(e) => {
                const id = e.target.value;
                setTemplateId(id);
                const tpl = templates.find((t) => t.id === id);
                if (tpl?.default_content) {
                  setIntroText(tpl.default_content);
                }
              }}
              className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3.5 py-2.5 text-sm"
            >
              <option value="">Formato estándar Taltum</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} v{t.version} — {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-premium">
              Título de la Propuesta *
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Fecha de Emisión *
            </label>
            <input
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Válida Hasta
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-premium">
            Presentación / Alcance Ejecutivo
          </label>
          <textarea
            rows={3}
            value={introText}
            onChange={(e) => setIntroText(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Ítems de la cotización */}
      <div className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border-soft pb-3.5">
          <h2 className="text-base font-bold text-petrol">
            2. Servicios e Ítems Cotizados ({items.length})
          </h2>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:flex-initial">
              <Sparkles className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dorado" />
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    addServiceFromCatalog(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="min-h-11 w-full sm:w-auto rounded-xl border border-dorado/40 bg-dorado/10 pl-9 pr-4 py-2 text-xs sm:text-sm font-semibold text-petrol"
              >
                <option value="">+ Agregar desde Catálogo Taltum...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.name} — {formatCOP(s.base_price)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={addBlankItem}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border-soft px-3.5 py-2 text-xs sm:text-sm font-semibold text-petrol hover:bg-bone-warm active:scale-[0.98] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Ítem Libre
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => {
            const lineTotal = Math.round(
              (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
            );
            return (
              <div
                key={item.key}
                className="rounded-2xl border border-border-soft bg-bone-white/50 p-4 sm:p-5 space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-lg bg-petrol px-2.5 py-1 text-xs font-bold text-white">
                      Ítem #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-gray-premium">
                      Subtotal:{" "}
                      <strong className="text-petrol">
                        {formatCOP(lineTotal)}
                      </strong>
                    </span>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Quitar
                    </button>
                  )}
                </div>

                {/* En tablet (sm/md) usa 6 columnas cómodas; en escritorio ancho (xl) 12 columnas */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-6 xl:grid-cols-12">
                  <div className="sm:col-span-2 xl:col-span-3">
                    <label className="block text-[11px] font-semibold text-gray-soft">
                      Pilar
                    </label>
                    <select
                      value={item.pillar}
                      onChange={(e) =>
                        updateItem(
                          item.key,
                          "pillar",
                          e.target.value as ExtendedPillar
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3 py-2.5 text-xs sm:text-sm"
                    >
                      {Object.entries(PILLAR_LABELS).map(([k, lbl]) => (
                        <option key={k} value={k}>
                          {lbl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4 xl:col-span-4">
                    <label className="block text-[11px] font-semibold text-gray-soft">
                      Concepto / Servicio *
                    </label>
                    <input
                      required
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.key, "description", e.target.value)
                      }
                      placeholder="Nombre del servicio o entregable"
                      className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2 xl:col-span-1">
                    <label className="block text-[11px] font-semibold text-gray-soft">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0.5}
                      step="0.5"
                      required
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.key, "quantity", Number(e.target.value))
                      }
                      className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3 py-2.5 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 xl:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-soft">
                      Unidad
                    </label>
                    <input
                      value={item.unit}
                      onChange={(e) =>
                        updateItem(item.key, "unit", e.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3 py-2.5 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 xl:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-soft">
                      Valor Unitario COP
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={10000}
                      required
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(
                          item.key,
                          "unit_price",
                          Number(e.target.value)
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3 py-2.5 text-xs sm:text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-soft">
                    Entregables específicos / Detalle del alcance
                  </label>
                  <input
                    value={item.details}
                    onChange={(e) =>
                      updateItem(item.key, "details", e.target.value)
                    }
                    placeholder="Entregables específicos o detalle del alcance..."
                    className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3.5 py-2 text-xs sm:text-sm text-gray-premium"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Condiciones y Totales */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-border-soft bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-petrol">
            3. Condiciones Comerciales y Notas
          </h3>
          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Condiciones de pago y entrega
            </label>
            <textarea
              rows={3}
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Observaciones adicionales (visibles en la propuesta)
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Incluye desplazamiento en el Valle de Aburrá."
              className="mt-1 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-petrol/20 bg-petrol p-5 sm:p-6 text-white shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-white/80">
              <span>Subtotal</span>
              <span className="font-semibold text-white">
                {formatCOP(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-white/80">
              <span>Descuento (%)</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-24 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-right text-sm text-white"
              />
            </div>

            <div className="flex items-center justify-between gap-3 text-white/80">
              <span>IVA (%)</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                className="w-24 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-right text-sm text-white"
              />
            </div>

            {taxPercent > 0 && (
              <div className="flex items-center justify-between text-xs text-white/65">
                <span>Impuesto calculado</span>
                <span>{formatCOP(taxAmount)}</span>
              </div>
            )}

            <div className="border-t border-white/15 pt-3 flex items-center justify-between gap-2">
              <span className="text-base font-bold text-dorado-light">
                Total Inversión
              </span>
              <span className="text-xl sm:text-2xl font-bold text-white">
                {formatCOP(total)}
              </span>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-500/20 border border-red-400/40 px-3.5 py-2.5 text-xs text-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="min-h-12 w-full rounded-xl bg-dorado px-4 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-dorado-dark active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {isPending
              ? "Generando cotización..."
              : "Guardar y Ver Documento Membretado"}
          </button>
        </div>
      </div>
    </form>
  );
}
