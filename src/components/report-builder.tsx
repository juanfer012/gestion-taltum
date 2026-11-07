"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createReportAction } from "@/app/actions";
import type {
  Company,
  DocumentTemplate,
  Pillar,
  ReportStatus,
} from "@/lib/types";

interface ReportBuilderProps {
  companies: Array<Pick<Company, "id" | "name" | "nit">>;
  templates: Array<
    Pick<
      DocumentTemplate,
      "id" | "code" | "version" | "name" | "pillar" | "default_content"
    >
  >;
  defaultCompanyId?: string;
  suggestedCode: string;
  defaultAuthorName: string;
}

export function ReportBuilder({
  companies,
  templates,
  defaultCompanyId,
  suggestedCode,
  defaultAuthorName,
}: ReportBuilderProps) {
  const router = useRouter();
  const firstTpl = templates[0] ?? null;

  const [reportCode, setReportCode] = useState(suggestedCode);
  const [companyId, setCompanyId] = useState(
    defaultCompanyId ?? companies[0]?.id ?? ""
  );
  const [templateId, setTemplateId] = useState(firstTpl?.id ?? "");
  const [pillar, setPillar] = useState<Pillar>(
    firstTpl && firstTpl.pillar !== "transversal" ? firstTpl.pillar : "sg_sst"
  );
  const [title, setTitle] = useState(
    firstTpl?.name ?? "Informe Técnico de Visita y Seguimiento"
  );
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [status, setStatus] = useState<ReportStatus>("finalizado");
  const [complianceScore, setComplianceScore] = useState<string>("");
  const [summary, setSummary] = useState(firstTpl?.default_content ?? "");
  const [findings, setFindings] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyId) {
      setError("Selecciona una empresa cliente.");
      return;
    }

    startTransition(async () => {
      let attachmentPath: string | null = null;
      let attachmentName: string | null = null;

      if (attachmentFile) {
        const supabase = createClient();
        const safeName = attachmentFile.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "_");
        attachmentPath = `reports/${companyId}/${Date.now()}-${safeName}`;
        attachmentName = attachmentFile.name;

        const { error: upErr } = await supabase.storage
          .from("taltum-files")
          .upload(attachmentPath, attachmentFile);

        if (upErr) {
          setError(`Error subiendo adjunto: ${upErr.message}`);
          return;
        }
      }

      const res = await createReportAction({
        report_code: reportCode,
        company_id: companyId,
        template_id: templateId || null,
        pillar,
        title,
        visit_date: visitDate,
        author_name: authorName,
        status,
        summary,
        findings,
        recommendations,
        compliance_score:
          complianceScore.trim() !== "" ? Number(complianceScore) : null,
        attachment_path: attachmentPath,
        attachment_name: attachmentName,
      });

      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }

      router.push(`/reportes/${res.id}`);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6 shadow-2xs space-y-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-gray-premium">
            Código del Reporte *
          </label>
          <input
            required
            value={reportCode}
            onChange={(e) => setReportCode(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-sm font-mono uppercase"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-premium">
            Empresa Evaluada *
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
                {c.name} — NIT {c.nit}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-premium">
            Formato Establecido
          </label>
          <select
            value={templateId}
            onChange={(e) => {
              const id = e.target.value;
              setTemplateId(id);
              const tpl = templates.find((t) => t.id === id);
              if (tpl) {
                setTitle(tpl.name);
                if (tpl.default_content) setSummary(tpl.default_content);
                if (tpl.pillar !== "transversal") setPillar(tpl.pillar);
              }
            }}
            className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3.5 py-2.5 text-sm"
          >
            <option value="">Formato libre Taltum</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} v{t.version} — {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-premium">
            Título del Informe / Acta *
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
            Pilar Técnico *
          </label>
          <select
            value={pillar}
            onChange={(e) => setPillar(e.target.value as Pillar)}
            className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3.5 py-2.5 text-sm"
          >
            <option value="sg_sst">SG-SST y Riesgo Psicosocial</option>
            <option value="gestion_humana">Gestión Humana</option>
            <option value="fisioterapia">Fisioterapia Especializada</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-premium">
            Fecha de Visita / Emisión *
          </label>
          <input
            type="date"
            required
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-premium">
            Profesional Responsable
          </label>
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-premium">
            % Cumplimiento (opcional, ej. Res. 0312)
          </label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.5"
            placeholder="Ej. 86.5"
            value={complianceScore}
            onChange={(e) => setComplianceScore(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-premium">
            Estado del Documento
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ReportStatus)}
            className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3.5 py-2.5 text-sm"
          >
            <option value="finalizado">Finalizado (Listo para cliente)</option>
            <option value="en_revision">En Revisión Interna</option>
            <option value="borrador">Borrador</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-premium">
            Soporte Adjunto PDF/Excel/Fotos (opcional)
          </label>
          <label className="mt-1 flex min-h-11 items-center gap-2 rounded-xl border border-border-soft bg-bone-white px-3.5 py-2.5 text-xs sm:text-sm text-petrol cursor-pointer hover:bg-bone-warm">
            <Paperclip className="h-4 w-4 text-dorado shrink-0" />
            <span className="truncate font-medium">
              {attachmentFile
                ? attachmentFile.name
                : "Tomar foto / Adjuntar soporte"}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
              className="hidden"
              onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-petrol">
          1. Objetivo y Resumen Ejecutivo de la Intervención
        </label>
        <textarea
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Contexto de la visita, áreas inspeccionadas o participantes..."
          className="mt-1.5 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-sm leading-relaxed"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-petrol">
          2. Hallazgos Técnicos / Condiciones Identificadas
        </label>
        <textarea
          rows={5}
          value={findings}
          onChange={(e) => setFindings(e.target.value)}
          placeholder="Detalle de hallazgos normativos, clínicos/ergonómicos u organizacionales..."
          className="mt-1.5 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-sm leading-relaxed"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-petrol">
          3. Plan de Acción, Recomendaciones y Compromisos
        </label>
        <textarea
          rows={5}
          value={recommendations}
          onChange={(e) => setRecommendations(e.target.value)}
          placeholder="Medidas correctivas/preventivas recomendadas, responsables y plazos..."
          className="mt-1.5 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-sm leading-relaxed"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="min-h-12 w-full sm:w-auto rounded-xl bg-petrol px-6 py-3 text-sm font-semibold text-white hover:bg-petrol-light active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Guardando reporte..." : "Emitir Reporte Técnico"}
        </button>
      </div>
    </form>
  );
}
