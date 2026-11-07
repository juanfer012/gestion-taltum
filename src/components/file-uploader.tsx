"use client";

import { useState, useTransition } from "react";
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerUploadedFileAction } from "@/app/actions";
import { FILE_CATEGORY_LABELS } from "@/lib/format";
import type { Company, DocumentTemplate, FileCategory } from "@/lib/types";

interface FileUploaderProps {
  companies: Array<Pick<Company, "id" | "name">>;
  defaultCompanyId?: string;
  templates?: Array<Pick<DocumentTemplate, "id" | "code" | "name">>;
}

export function FileUploader({
  companies,
  defaultCompanyId,
  templates = [],
}: FileUploaderProps) {
  const [companyId, setCompanyId] = useState(
    defaultCompanyId ?? companies[0]?.id ?? ""
  );
  const [category, setCategory] = useState<FileCategory>("sg_sst");
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("1.0");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!companyId) {
      setError("Selecciona la empresa destinataria.");
      return;
    }
    if (!selectedFile) {
      setError("Selecciona un archivo para subir.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const safeName = selectedFile.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `companies/${companyId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("taltum-files")
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setError(`Error al subir al almacenamiento: ${uploadError.message}`);
        return;
      }

      const res = await registerUploadedFileAction({
        company_id: companyId,
        template_id: templateId || null,
        category,
        title: title.trim() || selectedFile.name,
        description,
        file_name: selectedFile.name,
        storage_path: storagePath,
        mime_type: selectedFile.type || "application/octet-stream",
        size_bytes: selectedFile.size,
        version,
      });

      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }

      setTitle("");
      setDescription("");
      setSelectedFile(null);
      setSuccessMessage("Archivo subido de forma privada y registrado con éxito.");
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border-soft bg-white p-5 shadow-2xs space-y-4"
    >
      <div className="flex items-center gap-2.5 border-b border-border-soft pb-3">
        <span className="rounded-lg bg-dorado/15 p-2 text-dorado-dark">
          <UploadCloud className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-petrol">
            Subir Documento al Repositorio Privado
          </h3>
          <p className="text-xs text-gray-soft">
            PDF, Excel, Word o imágenes (máx. 50 MB). Luego podrás compartirlo por link.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {!defaultCompanyId && (
          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Empresa Cliente *
            </label>
            <select
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
            >
              <option value="">Seleccionar empresa...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-premium">
            Categoría Documental *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FileCategory)}
            className="mt-1 w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm focus:border-petrol focus:outline-none"
          >
            {Object.entries(FILE_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-premium">
            Título visible para el cliente *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Matriz Legal SST Actualizada 2026"
            className="mt-1 w-full rounded-lg border border-border-soft px-3 py-2 text-sm focus:border-petrol focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-premium">
              Formato asociado (opcional)
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-soft bg-white px-2.5 py-2 text-xs focus:border-petrol focus:outline-none"
            >
              <option value="">Sin formato base</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-premium">
              Versión
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-soft px-2.5 py-2 text-sm focus:border-petrol focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-premium">
          Notas o descripción breve
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Observaciones del entregable o periodo evaluado..."
          className="mt-1 w-full rounded-lg border border-border-soft px-3 py-2 text-sm focus:border-petrol focus:outline-none"
        />
      </div>

      <label className="flex min-h-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-petrol/20 bg-bone-white/70 px-4 py-6 text-center transition hover:border-dorado active:bg-bone-warm cursor-pointer">
        <FileText className="h-6 w-6 text-dorado mb-1.5" />
        <span className="text-xs sm:text-sm font-semibold text-petrol">
          {selectedFile
            ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`
            : "Toca aquí para elegir archivo o foto desde tu Tablet / Equipo"}
        </span>
        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setSelectedFile(file);
            if (file && !title) {
              setTitle(file.name.replace(/\.[^/.]+$/, ""));
            }
          }}
        />
      </label>

      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          {successMessage}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-petrol px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-petrol-light active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          <UploadCloud className="h-4 w-4 text-dorado-light" />
          {isPending ? "Subiendo documento..." : "Guardar en Repositorio"}
        </button>
      </div>
    </form>
  );
}
