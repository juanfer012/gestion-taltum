import type {
  CompanyStatus,
  ExtendedPillar,
  FileCategory,
  QuoteStatus,
  ReportStatus,
  RiskLevel,
} from "@/lib/types";

export const ARL_OPTIONS = [
  "ARL SURA",
  "Positiva",
  "Colmena Seguros",
  "Seguros Bolívar",
  "AXA Colpatria",
  "La Equidad",
  "Seguros de Vida Aurora",
] as const;

export const PILLAR_LABELS: Record<ExtendedPillar, string> = {
  sg_sst: "SG-SST y Riesgo Psicosocial",
  gestion_humana: "Gestión Humana",
  fisioterapia: "Fisioterapia Especializada",
  transversal: "Transversal 360°",
};

export const PILLAR_BADGES: Record<ExtendedPillar, string> = {
  sg_sst: "bg-petrol/10 text-petrol border-petrol/20",
  gestion_humana: "bg-dorado/15 text-dorado-dark border-dorado/30",
  fisioterapia: "bg-emerald-50 text-emerald-800 border-emerald-200",
  transversal: "bg-slate-100 text-slate-700 border-slate-200",
};

export const COMPANY_STATUS_STYLES: Record<
  CompanyStatus,
  { label: string; className: string }
> = {
  activo: {
    label: "Cliente Activo",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  prospecto: {
    label: "Prospecto",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  inactivo: {
    label: "Inactivo",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export const QUOTE_STATUS_STYLES: Record<
  QuoteStatus,
  { label: string; className: string }
> = {
  borrador: {
    label: "Borrador",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  enviada: {
    label: "Enviada",
    className: "bg-sky-50 text-sky-800 border-sky-200",
  },
  aprobada: {
    label: "Aprobada",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rechazada: {
    label: "Rechazada",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  vencida: {
    label: "Vencida",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

export const REPORT_STATUS_STYLES: Record<
  ReportStatus,
  { label: string; className: string }
> = {
  borrador: {
    label: "Borrador",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  en_revision: {
    label: "En Revisión",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  finalizado: {
    label: "Finalizado",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  sg_sst: "SG-SST y Normativa",
  gestion_humana: "Gestión Humana",
  fisioterapia: "Ergonomía y Fisioterapia",
  diagnosticos: "Diagnósticos y Auditorías",
  contratos: "Propuestas y Contratos",
  formatos: "Formatos Diligenciados",
  otros: "Otros Documentos",
};

export function formatCOP(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(num) ? num : 0);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Sin aperturas";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function formatBytes(bytes: number | null | undefined): string {
  const size = Number(bytes ?? 0);
  if (!size || size <= 0) return "0 KB";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calcula los Estándares Mínimos aplicables según la Resolución 0312 de 2019 en Colombia.
 */
export function getRes0312Standard(
  employeeCount: number,
  riskLevel: RiskLevel
): { count: 7 | 21 | 60; label: string } {
  if (riskLevel === "IV" || riskLevel === "V" || employeeCount > 50) {
    return {
      count: 60,
      label: "60 Estándares (Res. 0312 — >50 colab. o Riesgo IV–V)",
    };
  }
  if (employeeCount <= 10) {
    return {
      count: 7,
      label: "7 Estándares (Res. 0312 — ≤10 colab., Riesgo I–III)",
    };
  }
  return {
    count: 21,
    label: "21 Estándares (Res. 0312 — 11 a 50 colab., Riesgo I–III)",
  };
}

export function buildWhatsAppShareUrl(params: {
  phone?: string | null;
  recipientName?: string | null;
  companyName: string;
  resourceTitle: string;
  shareUrl: string;
}): string {
  const cleanPhone = (params.phone ?? "").replace(/[^\d]/g, "");
  const normalizedPhone =
    cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone;

  const greeting = params.recipientName
    ? `Hola ${params.recipientName},`
    : `Hola equipo de ${params.companyName},`;

  const message = `${greeting} te compartimos desde *Taltum* el siguiente documento: *${params.resourceTitle}*.\n\nPuedes visualizarlo de forma segura aquí:\n${params.shareUrl}`;

  const base = normalizedPhone
    ? `https://wa.me/${normalizedPhone}`
    : "https://wa.me/";

  return `${base}?text=${encodeURIComponent(message)}`;
}
