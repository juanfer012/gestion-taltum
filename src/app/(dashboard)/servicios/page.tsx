import { ChevronDown, FileCode2, Layers, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServiceAction } from "@/app/actions";
import { TemplateCreator } from "@/components/template-creator";
import { TemplateCard } from "@/components/template-card";
import { ServiceCard } from "@/components/service-card";
import type { DocumentTemplate, Service } from "@/lib/types";

export default async function ServiciosYFormatosPage() {
  const supabase = await createClient();

  const [servicesRes, templatesRes] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .order("pillar", { ascending: true })
      .order("code", { ascending: true }),
    supabase
      .from("templates")
      .select("*")
      .order("code", { ascending: true }),
  ]);

  const services = servicesRes.data ?? [];
  const templates = templatesRes.data ?? [];

  return (
    <div className="space-y-10">
      {/* Encabezado + Navegación rápida */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-petrol">
            Catálogo de Servicios y Formatos Establecidos
          </h1>
          <p className="text-sm text-gray-soft">
            Administra el portafolio de los 3 pilares de Taltum y las plantillas
            controladas con código y versión.
          </p>
        </div>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5">
          <a
            href="#formatos"
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border-soft bg-white px-4 py-2 text-xs font-semibold text-petrol shadow-2xs hover:border-dorado"
          >
            <FileCode2 className="h-3.5 w-3.5 text-dorado" />
            Formatos ({templates.length})
          </a>
          <a
            href="#portafolio"
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border-soft bg-white px-4 py-2 text-xs font-semibold text-petrol shadow-2xs hover:border-dorado"
          >
            <Layers className="h-3.5 w-3.5 text-dorado" />
            Servicios ({services.length})
          </a>
        </div>
      </div>

      {/* BLOQUE 1: FORMATOS ESTABLECIDOS */}
      <section id="formatos" className="scroll-mt-20 space-y-4">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-5 w-5 text-dorado" />
          <h2 className="text-lg font-bold text-petrol">
            Biblioteca de Formatos Establecidos ({templates.length})
          </h2>
        </div>

        <TemplateCreator />

        {templates.length === 0 ? (
          <div className="rounded-xl border border-border-soft bg-white p-8 text-center text-xs text-gray-soft">
            No hay formatos registrados aún.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl as DocumentTemplate}
              />
            ))}
          </div>
        )}
      </section>

      {/* BLOQUE 2: CATÁLOGO DE LOS 3 PILARES */}
      <section id="portafolio" className="scroll-mt-20 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-dorado" />
          <h2 className="text-lg font-bold text-petrol">
            Portafolio de Servicios Taltum ({services.length})
          </h2>
        </div>

        <details className="rounded-2xl border border-border-soft bg-white shadow-2xs">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-petrol">
            <span className="inline-flex items-center gap-2.5">
              <span className="rounded-xl bg-dorado p-2 text-white">
                <Plus className="h-4 w-4" />
              </span>
              <span>Agregar Nuevo Servicio al Catálogo</span>
            </span>
            <ChevronDown className="details-chevron h-4 w-4 shrink-0 text-dorado-dark transition-transform" />
          </summary>

          <form
            action={createServiceAction}
            className="border-t border-border-soft p-5 space-y-4 bg-bone-white/40"
          >
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-gray-premium">
                  Código *
                </label>
                <input
                  name="code"
                  required
                  placeholder="SRV-SST-04"
                  className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-premium">
                  Pilar *
                </label>
                <select
                  name="pillar"
                  defaultValue="sg_sst"
                  className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
                >
                  <option value="sg_sst">SG-SST y Riesgo Psicosocial</option>
                  <option value="gestion_humana">Gestión Humana</option>
                  <option value="fisioterapia">Fisioterapia Especializada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-premium">
                  Tarifa Base Sugerida (COP) *
                </label>
                <input
                  name="base_price"
                  type="number"
                  min={0}
                  defaultValue={1500000}
                  required
                  className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-premium">
                  Modalidad de Cobro
                </label>
                <select
                  name="billing_type"
                  defaultValue="proyecto"
                  className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
                >
                  <option value="proyecto">Por Proyecto</option>
                  <option value="mensual">Mensualidad / Iguala</option>
                  <option value="auditoria">Auditoría Puntual</option>
                  <option value="hora">Por Hora Especializada</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-premium">
                  Nombre del Servicio *
                </label>
                <input
                  name="name"
                  required
                  placeholder="Ej. Auditoría Externa de Cumplimiento Decreto 1072"
                  className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-premium">
                  Descripción breve
                </label>
                <input
                  name="description"
                  placeholder="Alcance ejecutivo que aparecerá al cotizar..."
                  className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2 xl:col-span-4">
                <label className="block text-xs font-medium text-gray-premium">
                  Entregables incluidos (uno por línea)
                </label>
                <textarea
                  name="deliverables"
                  rows={3}
                  placeholder={"Informe diagnóstico inicial\nPlan de acción priorizado\nSocialización con gerencia"}
                  className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="min-h-11 w-full sm:w-auto rounded-xl bg-petrol px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-petrol-light cursor-pointer"
              >
                Guardar Servicio
              </button>
            </div>
          </form>
        </details>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {services.map((srv) => (
            <ServiceCard key={srv.id} service={srv as Service} />
          ))}
        </div>
      </section>
    </div>
  );
}
