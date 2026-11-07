"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { deleteServiceAction, updateServiceAction } from "@/app/actions";
import { PILLAR_BADGES, PILLAR_LABELS, formatCOP } from "@/lib/format";
import type { BillingType, ExtendedPillar, Pillar, Service } from "@/lib/types";

export function ServiceCard({ service }: { service: Service }) {
  const deliverablesList: string[] = Array.isArray(service.deliverables)
    ? service.deliverables
    : [];

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [code, setCode] = useState(service.code);
  const [pillar, setPillar] = useState<Pillar>(service.pillar);
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description ?? "");
  const [deliverablesText, setDeliverablesText] = useState(
    deliverablesList.join("\n")
  );
  const [basePrice, setBasePrice] = useState(Number(service.base_price ?? 0));
  const [billingType, setBillingType] = useState<BillingType>(
    service.billing_type
  );
  const [isActive, setIsActive] = useState(service.is_active);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await updateServiceAction(service.id, {
        code,
        pillar,
        name,
        description,
        deliverablesText,
        base_price: basePrice,
        billing_type: billingType,
        is_active: isActive,
      });

      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }

      setEditing(false);
    });
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteServiceAction(service.id);
      if ("error" in res && res.error) {
        setError(res.error);
        setConfirmDelete(false);
      }
    });
  };

  const pillarKey = service.pillar as ExtendedPillar;

  return (
    <>
      <div
        className={`flex flex-col justify-between rounded-xl border bg-white p-5 shadow-2xs ${
          service.is_active
            ? "border-border-soft"
            : "border-border-soft opacity-70"
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${PILLAR_BADGES[pillarKey]}`}
              >
                {PILLAR_LABELS[pillarKey]}
              </span>
              {!service.is_active && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  Inactivo
                </span>
              )}
            </div>
            <span className="font-mono text-xs text-gray-soft">
              {service.code}
            </span>
          </div>

          <h3 className="mt-2.5 text-base font-bold text-petrol">
            {service.name}
          </h3>
          {service.description && (
            <p className="mt-1 text-xs text-gray-soft leading-relaxed">
              {service.description}
            </p>
          )}

          {deliverablesList.length > 0 && (
            <ul className="mt-3 space-y-1">
              {deliverablesList.map((d, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-gray-premium"
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-dorado mt-0.5" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 border-t border-border-soft pt-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-gray-soft">
              Modalidad:{" "}
              <strong className="text-petrol">{service.billing_type}</strong>
            </span>
            <span className="text-base font-bold text-petrol">
              {formatCOP(service.base_price)}
            </span>
          </div>

          {!confirmDelete ? (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setEditing(true);
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border-soft px-3 py-1.5 text-xs font-semibold text-petrol transition hover:bg-bone-warm active:scale-[0.98] cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5 text-dorado" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setConfirmDelete(true);
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 active:scale-[0.98] cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs">
              <span className="font-semibold text-red-800">
                ¿Eliminar {service.code}?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-9 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-premium cursor-pointer"
                >
                  No
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleDelete}
                  className="min-h-9 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "..." : "Sí, eliminar"}
                </button>
              </div>
            </div>
          )}

          {error && !editing && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-[11px] text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Modal de Edición */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-petrol-dark/65 p-0 sm:p-4 backdrop-blur-xs"
          onClick={() => setEditing(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full sm:max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border-soft bg-white p-5 sm:p-6 pb-safe shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border-soft sm:hidden" />
            <div className="flex items-center justify-between border-b border-border-soft pb-3">
              <h3 className="text-base font-bold text-petrol">
                Modificar Servicio ({service.code})
              </h3>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-soft hover:bg-bone-warm hover:text-petrol cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-gray-premium">
                    Código *
                  </label>
                  <input
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border-soft px-3 py-2 text-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-premium">
                    Pilar *
                  </label>
                  <select
                    value={pillar}
                    onChange={(e) => setPillar(e.target.value as Pillar)}
                    className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
                  >
                    <option value="sg_sst">SG-SST</option>
                    <option value="gestion_humana">Gestión Humana</option>
                    <option value="fisioterapia">Fisioterapia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-premium">
                    Tarifa Base (COP) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-premium">
                    Modalidad
                  </label>
                  <select
                    value={billingType}
                    onChange={(e) =>
                      setBillingType(e.target.value as BillingType)
                    }
                    className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
                  >
                    <option value="proyecto">Por Proyecto</option>
                    <option value="mensual">Mensualidad / Iguala</option>
                    <option value="auditoria">Auditoría Puntual</option>
                    <option value="hora">Por Hora</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-premium">
                  Nombre del Servicio *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-premium">
                  Descripción breve
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-premium">
                  Entregables incluidos (uno por línea)
                </label>
                <textarea
                  rows={4}
                  value={deliverablesText}
                  onChange={(e) => setDeliverablesText(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
                />
              </div>

              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border-soft bg-bone-white/60 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-petrol cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5 shrink-0 rounded accent-petrol"
                />
                <span>
                  Servicio activo (disponible al crear cotizaciones y asignar a clientes)
                </span>
              </label>

              {error && (
                <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="min-h-11 rounded-xl border border-border-soft px-4 py-2.5 text-sm font-medium text-gray-premium hover:bg-bone-warm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="min-h-11 rounded-xl bg-petrol px-5 py-2.5 text-sm font-semibold text-white hover:bg-petrol-light disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
