import Link from "next/link";
import {
  Building2,
  ChevronDown,
  Plus,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createCompanyAction } from "@/app/actions";
import {
  ARL_OPTIONS,
  COMPANY_STATUS_STYLES,
  getRes0312Standard,
} from "@/lib/format";
import type { CompanyStatus, RiskLevel } from "@/lib/types";

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; nueva?: string }>;
}) {
  const params = await searchParams;
  const queryText = (params.q ?? "").trim().toLowerCase();
  const statusFilter = params.estado ?? "todos";
  const openNewForm = params.nueva === "1";

  const supabase = await createClient();
  const { data: rawCompanies } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  const companies = (rawCompanies ?? []).filter((c) => {
    const matchesStatus =
      statusFilter === "todos" ? true : c.status === statusFilter;
    const matchesQuery = queryText
      ? c.name.toLowerCase().includes(queryText) ||
        c.nit.toLowerCase().includes(queryText) ||
        (c.contact_name ?? "").toLowerCase().includes(queryText)
      : true;
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-petrol">Empresas Cliente</h1>
          <p className="text-sm text-gray-soft">
            Directorio B2B con clasificación de riesgo ARL y cálculo automático
            de Estándares Mínimos (Res. 0312).
          </p>
        </div>
      </div>

      {/* Formulario desplegable para crear nueva empresa */}
      <details
        open={openNewForm}
        className="group rounded-2xl border border-border-soft bg-white shadow-2xs"
      >
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-petrol">
          <span className="inline-flex items-center gap-2.5 text-sm">
            <span className="rounded-xl bg-dorado p-2 text-white">
              <Plus className="h-4 w-4" />
            </span>
            Registrar Nueva Empresa o Prospecto
          </span>
          <ChevronDown className="details-chevron h-4 w-4 shrink-0 text-dorado-dark transition-transform" />
        </summary>

        <form
          action={createCompanyAction}
          className="border-t border-border-soft p-5 space-y-4 bg-bone-white/40"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-premium">
                Razón Social / Nombre de la Empresa *
              </label>
              <input
                name="name"
                required
                placeholder="Ej. Industrias Antioqueñas S.A.S."
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-premium">
                NIT *
              </label>
              <input
                name="nit"
                required
                placeholder="901.234.567-8"
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Estado Comercial
              </label>
              <select
                name="status"
                defaultValue="activo"
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
              >
                <option value="activo">Cliente Activo</option>
                <option value="prospecto">Prospecto / En Cotización</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-premium">
                ARL Afiliada
              </label>
              <select
                name="arl"
                defaultValue="ARL SURA"
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
              >
                <option value="">Sin especificar</option>
                {ARL_OPTIONS.map((arl) => (
                  <option key={arl} value={arl}>
                    {arl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Clase de Riesgo (I a V) *
              </label>
              <select
                name="risk_level"
                defaultValue="I"
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
              >
                <option value="I">Riesgo I (Mínimo)</option>
                <option value="II">Riesgo II (Bajo)</option>
                <option value="III">Riesgo III (Medio)</option>
                <option value="IV">Riesgo IV (Alto)</option>
                <option value="V">Riesgo V (Máximo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Nº de Colaboradores *
              </label>
              <input
                name="employee_count"
                type="number"
                min={1}
                defaultValue={15}
                required
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Sector Económico
              </label>
              <input
                name="sector"
                placeholder="Ej. Manufactura, Salud, Tecnología..."
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Contacto Principal *
              </label>
              <input
                name="contact_name"
                required
                placeholder="Nombre del líder GH / Gerente"
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Cargo del Contacto
              </label>
              <input
                name="contact_role"
                placeholder="Ej. Directora de Gestión Humana"
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Correo del Contacto *
              </label>
              <input
                name="contact_email"
                type="email"
                required
                placeholder="contacto@empresa.co"
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-premium">
                WhatsApp / Teléfono
              </label>
              <input
                name="contact_phone"
                placeholder="+57 300 000 0000"
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-premium">
                Ciudad
              </label>
              <input
                name="city"
                defaultValue="Medellín"
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-gray-premium">
                Notas u observaciones iniciales
              </label>
              <input
                name="notes"
                placeholder="Contexto normativo, prioridades de intervención o acuerdos..."
                className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="min-h-11 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-petrol px-5 py-2.5 text-sm font-semibold text-white hover:bg-petrol-light active:scale-[0.99] cursor-pointer"
            >
              Guardar Empresa y Abrir Ficha 360°
            </button>
          </div>
        </form>
      </details>

      {/* Buscador y Filtros Táctiles */}
      <div className="rounded-2xl border border-border-soft bg-white p-4 shadow-2xs space-y-3">
        <form method="GET" className="flex flex-col gap-2.5 sm:flex-row">
          {statusFilter !== "todos" && (
            <input type="hidden" name="estado" value={statusFilter} />
          )}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-soft" />
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Buscar por razón social, NIT o contacto..."
              className="w-full rounded-xl border border-border-soft bg-bone-white/60 pl-10 pr-3.5 py-2.5 text-sm focus:border-petrol focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="min-h-11 rounded-xl bg-petrol px-5 py-2.5 text-sm font-semibold text-white hover:bg-petrol-light cursor-pointer"
          >
            Buscar
          </button>
        </form>

        {/* Píldoras táctiles de estado para Tablet y Celular */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5">
          {[
            { value: "todos", label: "Todas" },
            { value: "activo", label: "Clientes Activos" },
            { value: "prospecto", label: "Prospectos" },
            { value: "inactivo", label: "Inactivos" },
          ].map((pill) => {
            const active = statusFilter === pill.value;
            const qs = new URLSearchParams();
            if (params.q) qs.set("q", params.q);
            if (pill.value !== "todos") qs.set("estado", pill.value);
            const href = qs.toString() ? `/empresas?${qs.toString()}` : "/empresas";
            return (
              <Link
                key={pill.value}
                href={href}
                className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-petrol bg-petrol text-white"
                    : "border-border-soft bg-bone-white/70 text-gray-premium hover:bg-bone-warm"
                }`}
              >
                {pill.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Grilla de Empresas */}
      {companies.length === 0 ? (
        <div className="rounded-xl border border-border-soft bg-white p-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-gray-soft/50" />
          <h3 className="mt-3 text-base font-bold text-petrol">
            No se encontraron empresas
          </h3>
          <p className="mt-1 text-xs text-gray-soft">
            Usa el formulario superior para registrar tu primer cliente o prospecto.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => {
            const statusStyle =
              COMPANY_STATUS_STYLES[company.status as CompanyStatus] ??
              COMPANY_STATUS_STYLES.activo;
            const res0312 = getRes0312Standard(
              company.employee_count,
              (company.risk_level as RiskLevel) || "I"
            );

            return (
              <Link
                key={company.id}
                href={`/empresas/${company.id}`}
                className="group flex flex-col justify-between rounded-xl border border-border-soft bg-white p-5 shadow-2xs transition hover:border-dorado hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-petrol group-hover:text-dorado-dark">
                        {company.name}
                      </h3>
                      <p className="text-xs font-mono text-gray-soft">
                        NIT {company.nit} · {company.city}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyle.className}`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-md bg-bone-warm px-2.5 py-1 font-medium text-petrol">
                      <ShieldAlert className="h-3.5 w-3.5 text-dorado" />
                      Riesgo {company.risk_level} {company.arl ? `· ${company.arl}` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-bone-warm px-2.5 py-1 font-medium text-petrol">
                      <Users className="h-3.5 w-3.5 text-petrol-light" />
                      {company.employee_count} colab.
                    </span>
                    <span className="inline-flex items-center rounded-md border border-petrol/15 bg-petrol/5 px-2.5 py-1 text-[11px] font-semibold text-petrol">
                      Res. 0312: {res0312.count} estándares
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-border-soft pt-3 flex items-center justify-between text-xs text-gray-soft">
                  <span className="truncate">
                    Contacto: <strong className="text-petrol">{company.contact_name}</strong>
                  </span>
                  <span className="font-semibold text-dorado-dark shrink-0">
                    Abrir ficha →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
