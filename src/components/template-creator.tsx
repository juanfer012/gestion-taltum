"use client";

import { useState, useTransition } from "react";
import { ChevronDown, FileCheck2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createTemplateAction } from "@/app/actions";
import type { ExtendedPillar, TemplateType } from "@/lib/types";

export function TemplateCreator() {
  const [code, setCode] = useState("");
  const [version, setVersion] = useState("1.0");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [name, setName] = useState("");
  const [pillar, setPillar] = useState<ExtendedPillar>("sg_sst");
  const [templateType, setTemplateType] = useState<TemplateType>("reporte");
  const [description, setDescription] = useState("");
  const [defaultContent, setDefaultContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      let storagePath: string | null = null;
      let fileName: string | null = null;

      if (file) {
        const supabase = createClient();
        const safeName = file.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "_");
        storagePath = `templates/${Date.now()}-${safeName}`;
        fileName = file.name;

        const { error: upErr } = await supabase.storage
          .from("taltum-files")
          .upload(storagePath, file);

        if (upErr) {
          setMessage(`Error subiendo plantilla base: ${upErr.message}`);
          return;
        }
      }

      const res = await createTemplateAction({
        code,
        version,
        effective_date: effectiveDate,
        name,
        pillar,
        template_type: templateType,
        description,
        default_content: defaultContent,
        storage_path: storagePath,
        file_name: fileName,
      });

      if ("error" in res && res.error) {
        setMessage(res.error);
        return;
      }

      setCode("");
      setName("");
      setDescription("");
      setDefaultContent("");
      setFile(null);
      setMessage("Formato establecido registrado correctamente.");
    });
  };

  return (
    <details className="rounded-2xl border border-border-soft bg-white shadow-2xs">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-petrol">
        <span className="inline-flex items-center gap-2.5">
          <span className="rounded-xl bg-petrol p-2 text-dorado-light">
            <Plus className="h-4 w-4" />
          </span>
          <span>Registrar Nuevo Formato Establecido (Plantilla Controlada)</span>
        </span>
        <ChevronDown className="details-chevron h-4 w-4 shrink-0 text-dorado-dark transition-transform" />
      </summary>

      <form
        onSubmit={handleSubmit}
        className="border-t border-border-soft p-5 space-y-4 bg-bone-white/40"
      >
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Código Documental *
            </label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ej. FT-SST-003"
              className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Versión *
            </label>
            <input
              required
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0"
              className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Fecha de Vigencia *
            </label>
            <input
              type="date"
              required
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Tipo de Formato *
            </label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as TemplateType)}
              className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
            >
              <option value="reporte">Reporte Técnico</option>
              <option value="acta">Acta de Visita / Comité</option>
              <option value="diagnostico">Diagnóstico / Auditoría</option>
              <option value="cotizacion">Propuesta / Cotización</option>
              <option value="matriz">Matriz (Excel/Control)</option>
              <option value="politica">Política / Reglamento</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-premium">
              Nombre Oficial del Formato *
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Matriz de Identificación de Peligros GTC-45"
              className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Pilar Asociado *
            </label>
            <select
              value={pillar}
              onChange={(e) => setPillar(e.target.value as ExtendedPillar)}
              className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
            >
              <option value="sg_sst">SG-SST</option>
              <option value="gestion_humana">Gestión Humana</option>
              <option value="fisioterapia">Fisioterapia Especializada</option>
              <option value="transversal">Transversal 360°</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Archivo Base Word/Excel/PDF (opcional)
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full rounded-lg border border-border-soft bg-white px-2.5 py-1.5 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Descripción de uso
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cuándo y cómo se aplica este formato..."
              className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Texto introductorio / alcance prellenado (para reportes o cotizaciones)
            </label>
            <input
              value={defaultContent}
              onChange={(e) => setDefaultContent(e.target.value)}
              placeholder="Se prellenará automáticamente al elegir este formato..."
              className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        {message && (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-petrol bg-bone-warm px-3 py-2 rounded-lg">
            <FileCheck2 className="h-4 w-4 text-dorado" />
            {message}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="min-h-11 w-full sm:w-auto rounded-xl bg-petrol px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-petrol-light disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Guardando..." : "Guardar Formato Establecido"}
          </button>
        </div>
      </form>
    </details>
  );
}
