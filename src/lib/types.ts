export type Pillar = "sg_sst" | "gestion_humana" | "fisioterapia";
export type ExtendedPillar = Pillar | "transversal";

export type RiskLevel = "I" | "II" | "III" | "IV" | "V";
export type CompanyStatus = "prospecto" | "activo" | "inactivo";
export type BillingType = "mensual" | "proyecto" | "hora" | "auditoria";

export type TemplateType =
  | "cotizacion"
  | "reporte"
  | "acta"
  | "diagnostico"
  | "matriz"
  | "politica"
  | "otro";

export type QuoteStatus =
  | "borrador"
  | "enviada"
  | "aprobada"
  | "rechazada"
  | "vencida";

export type ReportStatus = "borrador" | "en_revision" | "finalizado";

export type FileCategory =
  | "sg_sst"
  | "gestion_humana"
  | "fisioterapia"
  | "diagnosticos"
  | "contratos"
  | "formatos"
  | "otros";

export type ShareResourceType = "file" | "report" | "quote";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  job_title: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  nit: string;
  sector: string | null;
  arl: string | null;
  risk_level: RiskLevel;
  employee_count: number;
  city: string;
  address: string | null;
  website: string | null;
  contact_name: string;
  contact_role: string | null;
  contact_email: string;
  contact_phone: string | null;
  status: CompanyStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  code: string;
  pillar: Pillar;
  name: string;
  description: string | null;
  deliverables: string[];
  base_price: number;
  billing_type: BillingType;
  is_active: boolean;
  created_at: string;
}

export interface DocumentTemplate {
  id: string;
  code: string;
  version: string;
  effective_date: string;
  name: string;
  pillar: ExtendedPillar;
  template_type: TemplateType;
  description: string | null;
  default_content: string | null;
  storage_path: string | null;
  file_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  service_id: string | null;
  pillar: ExtendedPillar | null;
  description: string;
  details: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
  sort_order: number;
}

export interface Quote {
  id: string;
  quote_number: string;
  company_id: string;
  template_id: string | null;
  title: string;
  status: QuoteStatus;
  issue_date: string;
  valid_until: string | null;
  subtotal: number;
  discount_percent: number;
  tax_percent: number;
  total: number;
  currency: string;
  intro_text: string | null;
  terms_text: string | null;
  notes: string | null;
  created_at: string;
  companies?: Pick<Company, "id" | "name" | "nit" | "city" | "contact_name" | "contact_email" | "contact_phone">;
  templates?: Pick<DocumentTemplate, "id" | "code" | "version" | "name"> | null;
  quote_items?: QuoteItem[];
}

export interface TechnicalReport {
  id: string;
  report_code: string;
  company_id: string;
  template_id: string | null;
  pillar: Pillar;
  title: string;
  visit_date: string;
  author_name: string | null;
  status: ReportStatus;
  summary: string | null;
  findings: string | null;
  recommendations: string | null;
  compliance_score: number | null;
  attachment_path: string | null;
  attachment_name: string | null;
  created_at: string;
  companies?: Pick<Company, "id" | "name" | "nit" | "city" | "contact_name" | "contact_phone" | "arl" | "risk_level" | "employee_count">;
  templates?: Pick<DocumentTemplate, "id" | "code" | "version" | "name"> | null;
}

export interface ManagedFile {
  id: string;
  company_id: string;
  template_id: string | null;
  report_id: string | null;
  category: FileCategory;
  title: string;
  description: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  version: string;
  created_at: string;
  companies?: Pick<Company, "id" | "name" | "nit" | "contact_name" | "contact_phone">;
}

export interface ShareLink {
  id: string;
  token: string;
  company_id: string;
  resource_type: ShareResourceType;
  file_id: string | null;
  report_id: string | null;
  quote_id: string | null;
  label: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  signed_file_url: string | null;
  allow_download: boolean;
  is_active: boolean;
  expires_at: string | null;
  views_count: number;
  last_viewed_at: string | null;
  created_at: string;
  companies?: Pick<Company, "id" | "name">;
}
