"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  BillingType,
  CompanyStatus,
  ExtendedPillar,
  FileCategory,
  Pillar,
  QuoteStatus,
  ReportStatus,
  RiskLevel,
  ShareResourceType,
  TemplateType,
} from "@/lib/types";

const SAFE_STORAGE_PREFIXES = ["companies/", "reports/", "templates/"] as const;

function isSafeStoragePath(path: string | null | undefined): path is string {
  if (!path || typeof path !== "string") return false;
  const trimmed = path.trim();
  if (
    trimmed.length === 0 ||
    trimmed.length > 512 ||
    trimmed.includes("..") ||
    trimmed.startsWith("/") ||
    trimmed.includes("\\")
  ) {
    return false;
  }
  return SAFE_STORAGE_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

async function requireActiveConsultant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sesión expirada o no autorizada.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    throw new Error("Acceso exclusivo para consultoras internas activas de Taltum.");
  }

  return { supabase, user };
}

export async function loginAction(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo corporativo y contraseña." };
  }

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !authData.user) {
    return {
      error:
        "Credenciales inválidas. Verifica tu correo (@taltum.co) y contraseña.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_active")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return {
      error:
        "Esta cuenta no tiene permisos de consultoría interna activos en Taltum.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// ============================================================================
// EMPRESAS / CLIENTES
// ============================================================================
export async function createCompanyAction(formData: FormData) {
  const { supabase, user } = await requireActiveConsultant();

  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    nit: String(formData.get("nit") ?? "").trim(),
    sector: String(formData.get("sector") ?? "").trim() || null,
    arl: String(formData.get("arl") ?? "").trim() || null,
    risk_level: (String(formData.get("risk_level") ?? "I") as RiskLevel) || "I",
    employee_count: Math.max(1, Number(formData.get("employee_count") ?? 1)),
    city: String(formData.get("city") ?? "Medellín").trim() || "Medellín",
    address: String(formData.get("address") ?? "").trim() || null,
    website: String(formData.get("website") ?? "").trim() || null,
    contact_name: String(formData.get("contact_name") ?? "").trim(),
    contact_role: String(formData.get("contact_role") ?? "").trim() || null,
    contact_email: String(formData.get("contact_email") ?? "").trim(),
    contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
    status: (String(formData.get("status") ?? "activo") as CompanyStatus) || "activo",
    notes: String(formData.get("notes") ?? "").trim() || null,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("companies")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/empresas");
  redirect(`/empresas/${data.id}`);
}

export async function updateCompanyAction(companyId: string, formData: FormData) {
  const { supabase } = await requireActiveConsultant();

  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    nit: String(formData.get("nit") ?? "").trim(),
    sector: String(formData.get("sector") ?? "").trim() || null,
    arl: String(formData.get("arl") ?? "").trim() || null,
    risk_level: (String(formData.get("risk_level") ?? "I") as RiskLevel) || "I",
    employee_count: Math.max(1, Number(formData.get("employee_count") ?? 1)),
    city: String(formData.get("city") ?? "Medellín").trim() || "Medellín",
    address: String(formData.get("address") ?? "").trim() || null,
    website: String(formData.get("website") ?? "").trim() || null,
    contact_name: String(formData.get("contact_name") ?? "").trim(),
    contact_role: String(formData.get("contact_role") ?? "").trim() || null,
    contact_email: String(formData.get("contact_email") ?? "").trim(),
    contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
    status: (String(formData.get("status") ?? "activo") as CompanyStatus) || "activo",
    notes: String(formData.get("notes") ?? "").trim() || null,
  };

  const { error } = await supabase
    .from("companies")
    .update(payload)
    .eq("id", companyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/empresas");
  revalidatePath(`/empresas/${companyId}`);
}

export async function assignServiceToCompanyAction(formData: FormData) {
  const { supabase } = await requireActiveConsultant();
  const companyId = String(formData.get("company_id") ?? "");
  const serviceId = String(formData.get("service_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "") || null;
  const renewalDate = String(formData.get("renewal_date") ?? "") || null;
  const agreedPriceRaw = String(formData.get("agreed_price") ?? "").trim();
  const progress = Math.min(100, Math.max(0, Number(formData.get("progress") ?? 0)));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase.from("company_services").insert({
    company_id: companyId,
    service_id: serviceId,
    status: "activo",
    start_date: startDate,
    renewal_date: renewalDate,
    agreed_price: agreedPriceRaw ? Number(agreedPriceRaw) : null,
    progress,
    notes,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/empresas/${companyId}`);
}

export async function updateCompanyServiceProgressAction(
  id: string,
  companyId: string,
  progress: number,
  status: "pendiente" | "activo" | "pausado" | "completado"
) {
  const { supabase } = await requireActiveConsultant();
  const { error } = await supabase
    .from("company_services")
    .update({ progress, status })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/empresas/${companyId}`);
}

// ============================================================================
// CATÁLOGO DE SERVICIOS Y FORMATOS ESTABLECIDOS
// ============================================================================
export async function createServiceAction(formData: FormData) {
  const { supabase } = await requireActiveConsultant();
  const deliverablesText = String(formData.get("deliverables") ?? "");
  const deliverables = deliverablesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const { error } = await supabase.from("services").insert({
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    pillar: String(formData.get("pillar") ?? "sg_sst") as Pillar,
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    deliverables,
    base_price: Math.max(0, Number(formData.get("base_price") ?? 0)),
    billing_type: String(formData.get("billing_type") ?? "proyecto") as BillingType,
    is_active: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/servicios");
}

export async function createTemplateAction(params: {
  code: string;
  version: string;
  effective_date: string;
  name: string;
  pillar: ExtendedPillar;
  template_type: TemplateType;
  description?: string;
  default_content?: string;
  storage_path?: string | null;
  file_name?: string | null;
}) {
  const { supabase, user } = await requireActiveConsultant();
  const safePath = isSafeStoragePath(params.storage_path)
    ? params.storage_path
    : null;

  const { error } = await supabase.from("templates").insert({
    code: params.code.trim().toUpperCase(),
    version: params.version.trim() || "1.0",
    effective_date: params.effective_date || new Date().toISOString().slice(0, 10),
    name: params.name.trim(),
    pillar: params.pillar,
    template_type: params.template_type,
    description: params.description?.trim() || null,
    default_content: params.default_content?.trim() || null,
    storage_path: safePath,
    file_name: safePath ? params.file_name ?? null : null,
    created_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/servicios");
  revalidatePath("/cotizaciones/nueva");
  revalidatePath("/reportes/nuevo");
  return { ok: true };
}

export async function updateTemplateAction(
  templateId: string,
  params: {
    code: string;
    version: string;
    effective_date: string;
    name: string;
    pillar: ExtendedPillar;
    template_type: TemplateType;
    description?: string;
    default_content?: string;
    storage_path?: string | null;
    file_name?: string | null;
    previous_storage_path?: string | null;
  }
) {
  const { supabase } = await requireActiveConsultant();

  // Consultar el storage_path actual directamente en base de datos (no confiar en el cliente)
  const { data: currentTpl } = await supabase
    .from("templates")
    .select("storage_path")
    .eq("id", templateId)
    .maybeSingle();

  const nextSafePath = isSafeStoragePath(params.storage_path)
    ? params.storage_path
    : null;

  if (
    currentTpl?.storage_path &&
    isSafeStoragePath(currentTpl.storage_path) &&
    currentTpl.storage_path !== nextSafePath
  ) {
    await supabase.storage
      .from("taltum-files")
      .remove([currentTpl.storage_path]);
  }

  const { error } = await supabase
    .from("templates")
    .update({
      code: params.code.trim().toUpperCase(),
      version: params.version.trim() || "1.0",
      effective_date:
        params.effective_date || new Date().toISOString().slice(0, 10),
      name: params.name.trim(),
      pillar: params.pillar,
      template_type: params.template_type,
      description: params.description?.trim() || null,
      default_content: params.default_content?.trim() || null,
      storage_path: nextSafePath,
      file_name: nextSafePath ? params.file_name ?? null : null,
    })
    .eq("id", templateId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/servicios");
  revalidatePath("/cotizaciones/nueva");
  revalidatePath("/reportes/nuevo");
  return { ok: true };
}

export async function deleteTemplateAction(
  templateId: string,
  _storagePath?: string | null
) {
  const { supabase } = await requireActiveConsultant();

  const { data: currentTpl } = await supabase
    .from("templates")
    .select("storage_path")
    .eq("id", templateId)
    .maybeSingle();

  if (currentTpl?.storage_path && isSafeStoragePath(currentTpl.storage_path)) {
    await supabase.storage
      .from("taltum-files")
      .remove([currentTpl.storage_path]);
  }

  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", templateId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/servicios");
  revalidatePath("/cotizaciones/nueva");
  revalidatePath("/reportes/nuevo");
  return { ok: true };
}

export async function updateServiceAction(
  serviceId: string,
  params: {
    code: string;
    pillar: Pillar;
    name: string;
    description?: string;
    deliverablesText?: string;
    base_price: number;
    billing_type: BillingType;
    is_active: boolean;
  }
) {
  const { supabase } = await requireActiveConsultant();
  const deliverables = (params.deliverablesText ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("services")
    .update({
      code: params.code.trim().toUpperCase(),
      pillar: params.pillar,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      deliverables,
      base_price: Math.max(0, Number(params.base_price) || 0),
      billing_type: params.billing_type,
      is_active: params.is_active,
    })
    .eq("id", serviceId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/servicios");
  revalidatePath("/cotizaciones/nueva");
  revalidatePath("/empresas");
  return { ok: true };
}

export async function deleteServiceAction(serviceId: string) {
  const { supabase } = await requireActiveConsultant();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId);

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "Este servicio ya está vinculado a una empresa cliente activa. Puedes editarlo y marcarlo como inactivo para conservar el historial.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/servicios");
  revalidatePath("/cotizaciones/nueva");
  return { ok: true };
}

// ============================================================================
// COTIZACIONES
// ============================================================================
export interface CreateQuoteInput {
  quote_number: string;
  company_id: string;
  template_id: string | null;
  title: string;
  issue_date: string;
  valid_until: string | null;
  discount_percent: number;
  tax_percent: number;
  intro_text: string;
  terms_text: string;
  notes: string;
  items: Array<{
    service_id: string | null;
    pillar: ExtendedPillar | null;
    description: string;
    details: string;
    quantity: number;
    unit: string;
    unit_price: number;
  }>;
}

export async function createQuoteAction(input: CreateQuoteInput) {
  const { supabase, user } = await requireActiveConsultant();

  const normalizedItems = input.items.map((item, idx) => {
    const qty = Math.max(0.01, Number(item.quantity) || 1);
    const price = Math.max(0, Number(item.unit_price) || 0);
    return {
      service_id: item.service_id || null,
      pillar: item.pillar || "transversal",
      description: item.description.trim(),
      details: item.details.trim() || null,
      quantity: qty,
      unit: item.unit.trim() || "Servicio",
      unit_price: price,
      line_total: Math.round(qty * price),
      sort_order: idx,
    };
  });

  const subtotal = normalizedItems.reduce((acc, it) => acc + it.line_total, 0);
  const discountPct = Math.min(100, Math.max(0, Number(input.discount_percent) || 0));
  const taxPct = Math.min(100, Math.max(0, Number(input.tax_percent) || 0));
  const discountedSubtotal = subtotal * (1 - discountPct / 100);
  const total = Math.round(discountedSubtotal * (1 + taxPct / 100));

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      quote_number: input.quote_number.trim().toUpperCase(),
      company_id: input.company_id,
      template_id: input.template_id || null,
      title: input.title.trim(),
      status: "borrador",
      issue_date: input.issue_date,
      valid_until: input.valid_until || null,
      subtotal,
      discount_percent: discountPct,
      tax_percent: taxPct,
      total,
      currency: "COP",
      intro_text: input.intro_text.trim() || null,
      terms_text: input.terms_text.trim() || null,
      notes: input.notes.trim() || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !quote) {
    return { error: error?.message ?? "No se pudo guardar la cotización." };
  }

  if (normalizedItems.length > 0) {
    const { error: itemsError } = await supabase.from("quote_items").insert(
      normalizedItems.map((it) => ({
        ...it,
        quote_id: quote.id,
      }))
    );

    if (itemsError) {
      return { error: itemsError.message };
    }
  }

  revalidatePath("/");
  revalidatePath("/cotizaciones");
  revalidatePath(`/empresas/${input.company_id}`);
  return { id: quote.id };
}

export async function updateQuoteStatusAction(
  quoteId: string,
  status: QuoteStatus
) {
  const { supabase } = await requireActiveConsultant();
  const { data: quote, error } = await supabase
    .from("quotes")
    .update({ status })
    .eq("id", quoteId)
    .select("company_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (status === "aprobada" && quote?.company_id) {
    await supabase
      .from("companies")
      .update({ status: "activo" })
      .eq("id", quote.company_id);
  }

  revalidatePath("/");
  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${quoteId}`);
  if (quote?.company_id) {
    revalidatePath(`/empresas/${quote.company_id}`);
  }
}

// ============================================================================
// REPORTES TÉCNICOS
// ============================================================================
export async function createReportAction(params: {
  report_code: string;
  company_id: string;
  template_id: string | null;
  pillar: Pillar;
  title: string;
  visit_date: string;
  author_name: string;
  status: ReportStatus;
  summary: string;
  findings: string;
  recommendations: string;
  compliance_score: number | null;
  attachment_path?: string | null;
  attachment_name?: string | null;
}) {
  const { supabase, user } = await requireActiveConsultant();
  const safePath = isSafeStoragePath(params.attachment_path)
    ? params.attachment_path
    : null;

  const { data, error } = await supabase
    .from("reports")
    .insert({
      report_code: params.report_code.trim().toUpperCase(),
      company_id: params.company_id,
      template_id: params.template_id || null,
      pillar: params.pillar,
      title: params.title.trim(),
      visit_date: params.visit_date,
      author_name: params.author_name.trim() || "Consultoría Taltum",
      status: params.status,
      summary: params.summary.trim() || null,
      findings: params.findings.trim() || null,
      recommendations: params.recommendations.trim() || null,
      compliance_score: params.compliance_score,
      attachment_path: safePath,
      attachment_name: safePath ? params.attachment_name ?? null : null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No se pudo guardar el reporte." };
  }

  revalidatePath("/");
  revalidatePath("/reportes");
  revalidatePath(`/empresas/${params.company_id}`);
  return { id: data.id };
}

export async function updateReportStatusAction(
  reportId: string,
  status: ReportStatus
) {
  const { supabase } = await requireActiveConsultant();
  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", reportId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/reportes");
  revalidatePath(`/reportes/${reportId}`);
}

// ============================================================================
// ARCHIVOS DOCUMENTALES Y ENLACES COMPARTIBLES (/s/[token])
// ============================================================================
export async function registerUploadedFileAction(params: {
  company_id: string;
  template_id?: string | null;
  category: FileCategory;
  title: string;
  description?: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  version?: string;
}) {
  const { supabase, user } = await requireActiveConsultant();

  if (!isSafeStoragePath(params.storage_path)) {
    return { error: "Ruta de almacenamiento inválida." };
  }

  const { data, error } = await supabase
    .from("files")
    .insert({
      company_id: params.company_id,
      template_id: params.template_id || null,
      category: params.category,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      file_name: params.file_name,
      storage_path: params.storage_path,
      mime_type: params.mime_type || "application/octet-stream",
      size_bytes: Math.max(0, Number(params.size_bytes) || 0),
      version: params.version?.trim() || "1.0",
      uploaded_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No se pudo registrar el archivo." };
  }

  revalidatePath("/");
  revalidatePath("/archivos");
  revalidatePath(`/empresas/${params.company_id}`);
  return { id: data.id };
}

export async function getConsultantFileSignedUrlAction(storagePath: string) {
  const { supabase } = await requireActiveConsultant();
  if (!isSafeStoragePath(storagePath)) {
    return { error: "Ruta de archivo no permitida." };
  }

  const { data, error } = await supabase.storage
    .from("taltum-files")
    .createSignedUrl(storagePath, 900); // Vigencia corta de 15 minutos para la sesión del consultor

  if (error || !data?.signedUrl) {
    return { error: error?.message ?? "No se pudo abrir el archivo." };
  }
  return { url: data.signedUrl };
}

export async function deleteFileAction(fileId: string, _storagePath?: string) {
  const { supabase } = await requireActiveConsultant();

  const { data: fileRow } = await supabase
    .from("files")
    .select("storage_path")
    .eq("id", fileId)
    .maybeSingle();

  if (fileRow?.storage_path && isSafeStoragePath(fileRow.storage_path)) {
    await supabase.storage.from("taltum-files").remove([fileRow.storage_path]);
  }

  const { error } = await supabase.from("files").delete().eq("id", fileId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/archivos");
}

export async function createShareLinkAction(params: {
  company_id: string;
  resource_type: ShareResourceType;
  resource_id: string;
  storage_path?: string | null;
  label?: string;
  recipient_name?: string;
  recipient_email?: string;
  allow_download?: boolean;
  expires_in_days?: number | null;
}) {
  const { supabase, user } = await requireActiveConsultant();

  const days = params.expires_in_days ?? null;
  const ttlSeconds = days ? days * 86400 : 365 * 86400;
  const expiresAt = days
    ? new Date(Date.now() + ttlSeconds * 1000).toISOString()
    : null;

  let signedFileUrl: string | null = null;
  if (
    params.storage_path &&
    isSafeStoragePath(params.storage_path) &&
    (params.allow_download ?? true)
  ) {
    const { data: signedData } = await supabase.storage
      .from("taltum-files")
      .createSignedUrl(params.storage_path, ttlSeconds);
    signedFileUrl = signedData?.signedUrl ?? null;
  }

  const insertPayload: Record<string, unknown> = {
    company_id: params.company_id,
    resource_type: params.resource_type,
    file_id: params.resource_type === "file" ? params.resource_id : null,
    report_id: params.resource_type === "report" ? params.resource_id : null,
    quote_id: params.resource_type === "quote" ? params.resource_id : null,
    label: params.label?.trim() || null,
    recipient_name: params.recipient_name?.trim() || null,
    recipient_email: params.recipient_email?.trim() || null,
    signed_file_url: signedFileUrl,
    allow_download: params.allow_download ?? true,
    is_active: true,
    expires_at: expiresAt,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("share_links")
    .insert(insertPayload)
    .select("id, token, expires_at")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No se pudo generar el enlace." };
  }

  if (params.resource_type === "quote") {
    await supabase
      .from("quotes")
      .update({ status: "enviada" })
      .eq("id", params.resource_id)
      .eq("status", "borrador");
    revalidatePath(`/cotizaciones/${params.resource_id}`);
  }

  revalidatePath("/");
  revalidatePath("/archivos");
  revalidatePath(`/empresas/${params.company_id}`);
  return { token: data.token, expires_at: data.expires_at };
}

export async function toggleShareLinkAction(
  shareLinkId: string,
  isActive: boolean
) {
  const { supabase } = await requireActiveConsultant();
  const { error } = await supabase
    .from("share_links")
    .update({ is_active: isActive })
    .eq("id", shareLinkId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/archivos");
}

export async function respondSharedQuotePublicAction(
  token: string,
  decision: "aprobada" | "rechazada"
) {
  const cleanToken = (token ?? "").trim().toLowerCase();
  if (!/^[0-9a-f]{24,64}$/.test(cleanToken)) {
    return { error: "Token de enlace no válido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("respond_shared_quote", {
    p_token: cleanToken,
    p_decision: decision,
  });

  if (error || !data) {
    return { error: "No fue posible registrar la respuesta." };
  }

  revalidatePath(`/s/${cleanToken}`);
  return { ok: true };
}
