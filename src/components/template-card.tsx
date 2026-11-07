"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteTemplateAction, updateTemplateAction } from "@/app/actions";
import { PILLAR_BADGES, PILLAR_LABELS, formatDate } from "@/lib/format";
import { FileOpenButton } from "@/components/file-open-button";
import type {
  DocumentTemplate,
  ExtendedPillar,
  TemplateType,
} from "@/lib/types";

export function TemplateCard({ template }: { template: DocumentTemplate }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [code, setCode] = useState(template.code);
  const [version, setVersion] = useState(template.version);
  const [effectiveDate, setEffectiveDate] = useState(
    template.effective_date?.slice(0, 10) ??
      new Date().toISOString().slice(0, 10)
  );
  const [name, setName] = useState(template.name);
  const [pillar, setPillar] = useState<ExtendedPillar>(template.pillar);
  const [templateType, setTemplateType] = useState<TemplateType>(
    template.template_type
  );
  const [description, setDescription] = useState(template.description ?? "");
  const [defaultContent, setDefaultContent] = useState(
    template.default_content ?? ""
  );
  const [removeCurrentFile, setRemoveCurrentFile] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      let nextStoragePath: string | null = removeCurrentFile
        ? null
        : template.storage_path;
      let nextFileName: string | null = removeCurrentFile
        ? null
        : template.file_name;

      if (newFile) {
        const supabase = createClient();
        const safeName = newFile.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "_");
        nextStoragePath = `templates/${Date.now()}-${safeName}`;
        nextFileName = newFile.name;

        const { error: upErr } = await supabase.storage
          .from("taltum-files")
          .upload(nextStoragePath, newFile);

        if (upErr) {
          setError(`Error subiendo plantilla: ${upErr.message}`);
          return;
        }
      }

      const res = await updateTemplateAction(template.id, {
        code,
        version,
        effective_date: effectiveDate,
        name,
        pillar,
        template_type: templateType,
        description,
        default_content: defaultContent,
        storage_path: nextStoragePath,
        file_name: nextFileName,
        previous_storage_path: template.storage_path,
      });

      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }

      setNewFile(null);
      setRemoveCurrentFile(false);
      setEditing(false);
    });
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteTemplateAction(
        template.id,
        template.storage_path
      );
      if ("error" in res && res.error) {
        setError(res.error);
      } else {
        setConfirmDelete(false);
      }
    });
  };

  return (
    <>
      <div className="flex flex-col justify-between rounded-xl border border-border-soft bg-white p-5 shadow-2xs">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded bg-petrol px-2.5 py-0.5 font-mono text-xs font-bold text-dorado-light">
              {template.code} · v{template.version}
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${PILLAR_BADGES[template.pillar]}`}
            >
              {PILLAR_LABELS[template.pillar]}
            </span>
          </div>

          <h3 className="text-sm font-bold text-petrol">{template.name}</h3>

          {template.description && (
            <p className="text-xs text-gray-soft leading-relaxed">
              {template.description}
            </p>
          )}
        </div>

        <div className="mt-4 border-t border-border-soft pt-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-[11px] text-gray-soft">
            <span>Vigencia: {formatDate(template.effective_date)}</span>
            {template.storage_path ? (
              <FileOpenButton storagePath={template.storage_path} />
            ) : (
              <span className="uppercase tracking-wider font-semibold text-petrol/70">
                {template.template_type}
              </span>
            )}
          </div>

          {!confirmDelete ? (
            <div className="flex items-center justify-end gap-2 pt-1">
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
                onClick={() => setConfirmDelete(true)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 active:scale-[0.98] cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs">
              <span className="font-semibold text-red-800">
                ¿Eliminar {template.code}?
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
            <p className="rounded-xl bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">
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
                Modificar Formato Establecido ({template.code})
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                    Versión *
                  </label>
                  <input
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
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
                    className="mt-1 w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-premium">
                    Nombre Oficial del Formato *
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
                    Tipo de Formato *
                  </label>
                  <select
                    value={templateType}
                    onChange={(e) =>
                      setTemplateType(e.target.value as TemplateType)
                    }
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
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-premium">
                  Descripción de uso
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-premium">
                  Texto introductorio / alcance prellenado
                </label>
                <textarea
                  rows={3}
                  value={defaultContent}
                  onChange={(e) => setDefaultContent(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
                />
              </div>

              <div className="rounded-lg border border-border-soft bg-bone-white p-3 space-y-2 text-xs">
                <label className="block font-medium text-petrol">
                  Archivo plantilla base (Word / Excel / PDF)
                </label>
                {template.file_name && !removeCurrentFile && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-premium">
                      Actual: <strong>{template.file_name}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setRemoveCurrentFile(true)}
                      className="text-red-600 hover:underline cursor-pointer"
                    >
                      Quitar archivo actual
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded border border-border-soft bg-white px-2.5 py-1.5"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
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
