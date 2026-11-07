-- ============================================================================
-- gestion.taltum.co — Esquema Completo PostgreSQL + RLS + Storage + Seed
-- Proyecto Supabase: taltum (pflwgqjvushumvaluhkb)
-- ============================================================================

-- 0. Limpieza opcional de tablas demo previas (Prisma prototipo agosto 2026)
drop table if exists public.view_logs cascade;
drop table if exists public.share_links cascade;
drop table if exists public.reports cascade;
drop table if exists public.projects cascade;
drop table if exists public.companies cascade;
drop table if exists public.users cascade;
drop type if exists public."Role" cascade;
drop type if exists public."ProjectStatus" cascade;

-- Extensión pgcrypto para tokens seguros si se requiere desde SQL
create extension if not exists pgcrypto with schema extensions;

-- 1. Esquema privado para funciones internas de autorización RLS
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- Trigger genérico para mantener updated_at actualizado
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 2. Perfiles de Consultores Internos (vinculados a auth.users)
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  job_title text not null default 'Consultora Integral SST & GH',
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Función helper en esquema privado para verificar si el usuario autenticado
-- es uno de los consultores internos activos de Taltum
create or replace function private.is_consultant()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_active = true
  );
$$;

revoke execute on function private.is_consultant() from public, anon;
grant execute on function private.is_consultant() to authenticated;

-- Sincronizar automáticamente usuarios existentes en auth.users (admin1 y admin2)
insert into public.profiles (id, email, full_name, job_title, is_active)
select
  u.id,
  coalesce(u.email, ''),
  case
    when u.email = 'admin1@taltum.co' then 'Consultora Principal'
    when u.email = 'admin2@taltum.co' then 'Consultora Asociada'
    else coalesce(u.raw_user_meta_data->>'full_name', split_part(coalesce(u.email, 'Consultor'), '@', 1))
  end,
  'Consultoría Integral Taltum',
  true
from auth.users u
on conflict (id) do update
set email = excluded.email;

-- ============================================================================
-- 3. Empresas / Clientes (CRM B2B adaptado a normativa colombiana Res. 0312)
-- ============================================================================
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nit text not null,
  sector text,
  arl text,
  risk_level text not null default 'I' check (risk_level in ('I', 'II', 'III', 'IV', 'V')),
  employee_count integer not null default 1 check (employee_count >= 1),
  city text not null default 'Medellín',
  address text,
  website text,
  contact_name text not null,
  contact_role text,
  contact_email text not null,
  contact_phone text,
  status text not null default 'activo' check (status in ('prospecto', 'activo', 'inactivo')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index companies_created_by_idx on public.companies (created_by);
create index companies_status_idx on public.companies (status);
create index companies_nit_idx on public.companies (nit);

create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 4. Catálogo de Servicios (Los 3 Pilares de Taltum)
-- ============================================================================
create table public.services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  pillar text not null check (pillar in ('sg_sst', 'gestion_humana', 'fisioterapia')),
  name text not null,
  description text,
  deliverables jsonb not null default '[]'::jsonb,
  base_price numeric(14,2) not null default 0 check (base_price >= 0),
  billing_type text not null default 'proyecto' check (billing_type in ('mensual', 'proyecto', 'hora', 'auditoria')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_pillar_idx on public.services (pillar);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 5. Biblioteca de Formatos Establecidos (Control Documental SST / GH / Fisio)
-- ============================================================================
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  version text not null default '1.0',
  effective_date date not null default current_date,
  name text not null,
  pillar text not null check (pillar in ('sg_sst', 'gestion_humana', 'fisioterapia', 'transversal')),
  template_type text not null check (template_type in ('cotizacion', 'reporte', 'acta', 'diagnostico', 'matriz', 'politica', 'otro')),
  description text,
  fields_schema jsonb not null default '[]'::jsonb,
  default_content text,
  storage_path text,
  file_name text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index templates_created_by_idx on public.templates (created_by);
create index templates_pillar_type_idx on public.templates (pillar, template_type);

create trigger templates_set_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 6. Servicios Contratados por Empresa ( Seguimiento y Renovaciones )
-- ============================================================================
create table public.company_services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  status text not null default 'activo' check (status in ('pendiente', 'activo', 'pausado', 'completado')),
  start_date date,
  renewal_date date,
  agreed_price numeric(14,2) check (agreed_price is null or agreed_price >= 0),
  progress integer not null default 0 check (progress between 0 and 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index company_services_company_id_idx on public.company_services (company_id);
create index company_services_service_id_idx on public.company_services (service_id);

create trigger company_services_set_updated_at
  before update on public.company_services
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 7. Cotizaciones e Ítems de Cotización
-- ============================================================================
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  company_id uuid not null references public.companies(id) on delete cascade,
  template_id uuid references public.templates(id) on delete set null,
  title text not null,
  status text not null default 'borrador' check (status in ('borrador', 'enviada', 'aprobada', 'rechazada', 'vencida')),
  issue_date date not null default current_date,
  valid_until date,
  subtotal numeric(14,2) not null default 0,
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  tax_percent numeric(5,2) not null default 19 check (tax_percent between 0 and 100),
  total numeric(14,2) not null default 0,
  currency text not null default 'COP',
  intro_text text,
  terms_text text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quotes_company_id_idx on public.quotes (company_id);
create index quotes_template_id_idx on public.quotes (template_id);
create index quotes_created_by_idx on public.quotes (created_by);
create index quotes_status_idx on public.quotes (status);

create trigger quotes_set_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  pillar text check (pillar in ('sg_sst', 'gestion_humana', 'fisioterapia', 'transversal')),
  description text not null,
  details text,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit text not null default 'Servicio',
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  line_total numeric(14,2) not null default 0 check (line_total >= 0),
  sort_order integer not null default 0
);

create index quote_items_quote_id_idx on public.quote_items (quote_id);
create index quote_items_service_id_idx on public.quote_items (service_id);

-- ============================================================================
-- 8. Reportes Técnicos, Actas e Informes
-- ============================================================================
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  report_code text not null unique,
  company_id uuid not null references public.companies(id) on delete cascade,
  template_id uuid references public.templates(id) on delete set null,
  pillar text not null check (pillar in ('sg_sst', 'gestion_humana', 'fisioterapia')),
  title text not null,
  visit_date date not null default current_date,
  author_name text,
  status text not null default 'borrador' check (status in ('borrador', 'en_revision', 'finalizado')),
  summary text,
  findings text,
  recommendations text,
  compliance_score numeric(5,2) check (compliance_score is null or (compliance_score between 0 and 100)),
  structured_data jsonb not null default '{}'::jsonb,
  attachment_path text,
  attachment_name text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reports_company_id_idx on public.reports (company_id);
create index reports_template_id_idx on public.reports (template_id);
create index reports_created_by_idx on public.reports (created_by);
create index reports_status_idx on public.reports (status);

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 9. Repositorio Documental Privado por Empresa
-- ============================================================================
create table public.files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  template_id uuid references public.templates(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  category text not null check (category in ('sg_sst', 'gestion_humana', 'fisioterapia', 'diagnosticos', 'contratos', 'formatos', 'otros')),
  title text not null,
  description text,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0,
  version text not null default '1.0',
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index files_company_id_idx on public.files (company_id);
create index files_template_id_idx on public.files (template_id);
create index files_report_id_idx on public.files (report_id);
create index files_uploaded_by_idx on public.files (uploaded_by);
create index files_category_idx on public.files (category);

create trigger files_set_updated_at
  before update on public.files
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 10. Enlaces Públicos Compartibles (/s/[token]) y Trazabilidad de Aperturas
-- ============================================================================
create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  company_id uuid not null references public.companies(id) on delete cascade,
  resource_type text not null check (resource_type in ('file', 'report', 'quote')),
  file_id uuid references public.files(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete cascade,
  label text,
  recipient_name text,
  recipient_email text,
  signed_file_url text,
  allow_download boolean not null default true,
  is_active boolean not null default true,
  expires_at timestamptz,
  views_count integer not null default 0,
  last_viewed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint share_links_single_target_chk check (
    (resource_type = 'file' and file_id is not null and report_id is null and quote_id is null) or
    (resource_type = 'report' and report_id is not null and file_id is null and quote_id is null) or
    (resource_type = 'quote' and quote_id is not null and file_id is null and report_id is null)
  )
);

create index share_links_company_id_idx on public.share_links (company_id);
create index share_links_file_id_idx on public.share_links (file_id);
create index share_links_report_id_idx on public.share_links (report_id);
create index share_links_quote_id_idx on public.share_links (quote_id);
create index share_links_created_by_idx on public.share_links (created_by);

create trigger share_links_set_updated_at
  before update on public.share_links
  for each row execute function public.set_updated_at();

create table public.share_view_logs (
  id bigint generated always as identity primary key,
  share_link_id uuid not null references public.share_links(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  user_agent text
);

create index share_view_logs_share_link_id_idx on public.share_view_logs (share_link_id);

-- ============================================================================
-- 11. Función Pública Segura para Resolver /s/[token] (Sin Login de Cliente)
-- ============================================================================
create or replace function public.get_shared_resource(
  p_token text,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.share_links%rowtype;
  v_company jsonb;
  v_payload jsonb;
begin
  if p_token is null or length(trim(p_token)) < 12 then
    return null;
  end if;

  select *
  into v_link
  from public.share_links s
  where s.token = trim(p_token)
    and s.is_active = true
    and (s.expires_at is null or s.expires_at > now())
  limit 1;

  if not found then
    return null;
  end if;

  -- Registrar apertura y actualizar métricas
  update public.share_links
  set views_count = views_count + 1,
      last_viewed_at = now()
  where id = v_link.id;

  insert into public.share_view_logs (share_link_id, user_agent)
  values (v_link.id, left(coalesce(p_user_agent, ''), 500));

  select jsonb_build_object(
    'name', c.name,
    'nit', c.nit,
    'city', c.city,
    'contact_name', c.contact_name
  )
  into v_company
  from public.companies c
  where c.id = v_link.company_id;

  if v_link.resource_type = 'file' then
    select jsonb_build_object(
      'id', f.id,
      'title', f.title,
      'description', f.description,
      'category', f.category,
      'file_name', f.file_name,
      'storage_path', f.storage_path,
      'mime_type', f.mime_type,
      'size_bytes', f.size_bytes,
      'version', f.version,
      'created_at', f.created_at,
      'signed_url', case when v_link.allow_download then v_link.signed_file_url else null end
    )
    into v_payload
    from public.files f
    where f.id = v_link.file_id;

  elsif v_link.resource_type = 'report' then
    select jsonb_build_object(
      'id', r.id,
      'report_code', r.report_code,
      'pillar', r.pillar,
      'title', r.title,
      'visit_date', r.visit_date,
      'author_name', r.author_name,
      'status', r.status,
      'summary', r.summary,
      'findings', r.findings,
      'recommendations', r.recommendations,
      'compliance_score', r.compliance_score,
      'structured_data', r.structured_data,
      'attachment_name', r.attachment_name,
      'signed_url', case when v_link.allow_download then v_link.signed_file_url else null end,
      'template', (
        select jsonb_build_object('code', t.code, 'version', t.version, 'name', t.name)
        from public.templates t
        where t.id = r.template_id
      )
    )
    into v_payload
    from public.reports r
    where r.id = v_link.report_id;

  elsif v_link.resource_type = 'quote' then
    select jsonb_build_object(
      'id', q.id,
      'quote_number', q.quote_number,
      'title', q.title,
      'status', q.status,
      'issue_date', q.issue_date,
      'valid_until', q.valid_until,
      'subtotal', q.subtotal,
      'discount_percent', q.discount_percent,
      'tax_percent', q.tax_percent,
      'total', q.total,
      'currency', q.currency,
      'intro_text', q.intro_text,
      'terms_text', q.terms_text,
      'notes', q.notes,
      'template', (
        select jsonb_build_object('code', t.code, 'version', t.version, 'name', t.name)
        from public.templates t
        where t.id = q.template_id
      ),
      'items', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', qi.id,
            'pillar', qi.pillar,
            'description', qi.description,
            'details', qi.details,
            'quantity', qi.quantity,
            'unit', qi.unit,
            'unit_price', qi.unit_price,
            'line_total', qi.line_total
          ) order by qi.sort_order asc
        )
        from public.quote_items qi
        where qi.quote_id = q.id
      ), '[]'::jsonb)
    )
    into v_payload
    from public.quotes q
    where q.id = v_link.quote_id;
  end if;

  if v_payload is null then
    return null;
  end if;

  return jsonb_build_object(
    'share', jsonb_build_object(
      'label', v_link.label,
      'recipient_name', v_link.recipient_name,
      'resource_type', v_link.resource_type,
      'allow_download', v_link.allow_download,
      'expires_at', v_link.expires_at,
      'created_at', v_link.created_at
    ),
    'company', v_company,
    'resource', v_payload
  );
end;
$$;

revoke execute on function public.get_shared_resource(text, text) from public;
grant execute on function public.get_shared_resource(text, text) to anon, authenticated;

-- Función pública para que el destinatario pueda aprobar/responder una cotización compartida
create or replace function public.respond_shared_quote(
  p_token text,
  p_decision text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote_id uuid;
begin
  if p_decision not in ('aprobada', 'rechazada') then
    return false;
  end if;

  select s.quote_id
  into v_quote_id
  from public.share_links s
  where s.token = trim(p_token)
    and s.resource_type = 'quote'
    and s.is_active = true
    and (s.expires_at is null or s.expires_at > now())
  limit 1;

  if v_quote_id is null then
    return false;
  end if;

  update public.quotes
  set status = p_decision
  where id = v_quote_id
    and status in ('borrador', 'enviada');

  return true;
end;
$$;

revoke execute on function public.respond_shared_quote(text, text) from public;
grant execute on function public.respond_shared_quote(text, text) to anon, authenticated;

-- ============================================================================
-- 12. Row Level Security (RLS) en TODAS las Tablas Expuestas
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.services enable row level security;
alter table public.templates enable row level security;
alter table public.company_services enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.reports enable row level security;
alter table public.files enable row level security;
alter table public.share_links enable row level security;
alter table public.share_view_logs enable row level security;

-- Permisos base del esquema para rol authenticated (las políticas RLS filtran las filas)
grant select, insert, update, delete on
  public.profiles,
  public.companies,
  public.services,
  public.templates,
  public.company_services,
  public.quotes,
  public.quote_items,
  public.reports,
  public.files,
  public.share_links,
  public.share_view_logs
to authenticated;

revoke all on
  public.profiles,
  public.companies,
  public.services,
  public.templates,
  public.company_services,
  public.quotes,
  public.quote_items,
  public.reports,
  public.files,
  public.share_links,
  public.share_view_logs
from anon;

-- Políticas RLS para consultores internos activos ((select private.is_consultant()))
create policy profiles_consultant_select on public.profiles
  for select to authenticated using ((select private.is_consultant()));
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and (select private.is_consultant()))
  with check (id = (select auth.uid()) and (select private.is_consultant()));

create policy companies_consultant_select on public.companies
  for select to authenticated using ((select private.is_consultant()));
create policy companies_consultant_insert on public.companies
  for insert to authenticated with check ((select private.is_consultant()));
create policy companies_consultant_update on public.companies
  for update to authenticated using ((select private.is_consultant())) with check ((select private.is_consultant()));
create policy companies_consultant_delete on public.companies
  for delete to authenticated using ((select private.is_consultant()));

create policy services_consultant_select on public.services
  for select to authenticated using ((select private.is_consultant()));
create policy services_consultant_insert on public.services
  for insert to authenticated with check ((select private.is_consultant()));
create policy services_consultant_update on public.services
  for update to authenticated using ((select private.is_consultant())) with check ((select private.is_consultant()));
create policy services_consultant_delete on public.services
  for delete to authenticated using ((select private.is_consultant()));

create policy templates_consultant_select on public.templates
  for select to authenticated using ((select private.is_consultant()));
create policy templates_consultant_insert on public.templates
  for insert to authenticated with check ((select private.is_consultant()));
create policy templates_consultant_update on public.templates
  for update to authenticated using ((select private.is_consultant())) with check ((select private.is_consultant()));
create policy templates_consultant_delete on public.templates
  for delete to authenticated using ((select private.is_consultant()));

create policy company_services_consultant_select on public.company_services
  for select to authenticated using ((select private.is_consultant()));
create policy company_services_consultant_insert on public.company_services
  for insert to authenticated with check ((select private.is_consultant()));
create policy company_services_consultant_update on public.company_services
  for update to authenticated using ((select private.is_consultant())) with check ((select private.is_consultant()));
create policy company_services_consultant_delete on public.company_services
  for delete to authenticated using ((select private.is_consultant()));

create policy quotes_consultant_select on public.quotes
  for select to authenticated using ((select private.is_consultant()));
create policy quotes_consultant_insert on public.quotes
  for insert to authenticated with check ((select private.is_consultant()));
create policy quotes_consultant_update on public.quotes
  for update to authenticated using ((select private.is_consultant())) with check ((select private.is_consultant()));
create policy quotes_consultant_delete on public.quotes
  for delete to authenticated using ((select private.is_consultant()));

create policy quote_items_consultant_select on public.quote_items
  for select to authenticated using ((select private.is_consultant()));
create policy quote_items_consultant_insert on public.quote_items
  for insert to authenticated with check ((select private.is_consultant()));
create policy quote_items_consultant_update on public.quote_items
  for update to authenticated using ((select private.is_consultant())) with check ((select private.is_consultant()));
create policy quote_items_consultant_delete on public.quote_items
  for delete to authenticated using ((select private.is_consultant()));

create policy reports_consultant_select on public.reports
  for select to authenticated using ((select private.is_consultant()));
create policy reports_consultant_insert on public.reports
  for insert to authenticated with check ((select private.is_consultant()));
create policy reports_consultant_update on public.reports
  for update to authenticated using ((select private.is_consultant())) with check ((select private.is_consultant()));
create policy reports_consultant_delete on public.reports
  for delete to authenticated using ((select private.is_consultant()));

create policy files_consultant_select on public.files
  for select to authenticated using ((select private.is_consultant()));
create policy files_consultant_insert on public.files
  for insert to authenticated with check ((select private.is_consultant()));
create policy files_consultant_update on public.files
  for update to authenticated using ((select private.is_consultant())) with check ((select private.is_consultant()));
create policy files_consultant_delete on public.files
  for delete to authenticated using ((select private.is_consultant()));

create policy share_links_consultant_select on public.share_links
  for select to authenticated using ((select private.is_consultant()));
create policy share_links_consultant_insert on public.share_links
  for insert to authenticated with check ((select private.is_consultant()));
create policy share_links_consultant_update on public.share_links
  for update to authenticated using ((select private.is_consultant())) with check ((select private.is_consultant()));
create policy share_links_consultant_delete on public.share_links
  for delete to authenticated using ((select private.is_consultant()));

create policy share_view_logs_consultant_select on public.share_view_logs
  for select to authenticated using ((select private.is_consultant()));

-- ============================================================================
-- 13. Bucket Privado en Supabase Storage (taltum-files) + Políticas RLS
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('taltum-files', 'taltum-files', false, 52428800) -- 50 MB por archivo
on conflict (id) do update
set public = false,
    file_size_limit = 52428800;

drop policy if exists taltum_files_select on storage.objects;
drop policy if exists taltum_files_insert on storage.objects;
drop policy if exists taltum_files_update on storage.objects;
drop policy if exists taltum_files_delete on storage.objects;

create policy taltum_files_select on storage.objects
  for select to authenticated
  using (bucket_id = 'taltum-files' and (select private.is_consultant()));

create policy taltum_files_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'taltum-files' and (select private.is_consultant()));

create policy taltum_files_update on storage.objects
  for update to authenticated
  using (bucket_id = 'taltum-files' and (select private.is_consultant()))
  with check (bucket_id = 'taltum-files' and (select private.is_consultant()));

create policy taltum_files_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'taltum-files' and (select private.is_consultant()));

-- ============================================================================
-- 14. Semilla Inicial: Los 3 Pilares de taltum.co + Formatos Establecidos
-- ============================================================================
insert into public.services (code, pillar, name, description, deliverables, base_price, billing_type)
values
  (
    'SRV-SST-01',
    'sg_sst',
    'Diseño e Implementación Integral de SG-SST',
    'Construcción y puesta en marcha del Sistema de Gestión de Seguridad y Salud en el Trabajo alineado con el Decreto 1072 y la Resolución 0312.',
    '["Diagnóstico técnico de brechas legales", "Diseño de políticas y matriz legal SST a la medida", "Plan de trabajo anual según clase de riesgo", " Preparación para autoevaluación ante MinTrabajo"]'::jsonb,
    2800000,
    'proyecto'
  ),
  (
    'SRV-SST-02',
    'sg_sst',
    'Administración Mensual SG-SST y Auditoría Normativa',
    'Acompañamiento técnico mensual para sostenimiento del SG-SST, comités (COPASST/CCL), indicadores e inspecciones planeadas.',
    '["Visitas técnicas periódicas", "Seguimiento de plan anual e indicadores", "Auditoría interna con rigor normativo", "Soporte ante requerimientos de ARL y MinTrabajo"]'::jsonb,
    1450000,
    'mensual'
  ),
  (
    'SRV-SST-03',
    'sg_sst',
    'Batería de Riesgo Psicosocial y Plan de Intervención',
    'Aplicación reglamentaria de la Batería de Riesgo Psicosocial por psicólogo especialista en SST y despliegue de intervención.',
    '["Aplicación consentida de instrumentos oficiales", "Informe epidemiológico gerencial", "Plan de intervención psicosocial priorizado"]'::jsonb,
    2200000,
    'proyecto'
  ),
  (
    'SRV-GHU-01',
    'gestion_humana',
    'Procesos Transversales de Gestión Humana y Clima Organizacional',
    'Estructuración del ciclo de vida del colaborador enfocada en retención de talento clave, onboarding y clima laboral.',
    '["Diagnóstico y plan de mejora de clima organizacional", "Manual de perfiles, onboarding y entrenamiento al cargo", "Rutas de plan de carrera y retención"]'::jsonb,
    2500000,
    'proyecto'
  ),
  (
    'SRV-GHU-02',
    'gestion_humana',
    'Modelo de Desempeño basado en OKRs y Competencias',
    'Diseño e implementación de evaluación objetiva del desempeño alineada con la rentabilidad del negocio.',
    '["Definición de competencias organizacionales y por rol", "Matriz de OKRs/KPIs por área", "Herramienta y acompañamiento de calibración"]'::jsonb,
    2100000,
    'proyecto'
  ),
  (
    'SRV-FSO-01',
    'fisioterapia',
    'Evaluación Ergonómica Clínica de Puestos de Trabajo',
    'Análisis biomecánico en sitio por fisioterapeuta especialista en SST para prevenir desórdenes musculoesqueléticos.',
    '["Inspección ergonómica clínica por puesto", "Informe fotográfico y valoración de carga física", "Recomendaciones técnicas de ajuste e ingeniería"]'::jsonb,
    1850000,
    'proyecto'
  ),
  (
    'SRV-FSO-02',
    'fisioterapia',
    'Sistema de Vigilancia Epidemiológica Osteomuscular (SVE-DME)',
    'Seguimiento continuo de sintomatología osteomuscular, escuelas de espalda/miembro superior y gimnasia laboral dirigida.',
    '["Encuesta de morbilidad sentida", "Clasificación de casos y seguimiento clínico", "Programa de ejercicio laboral y capacitación postural"]'::jsonb,
    1350000,
    'mensual'
  )
on conflict (code) do nothing;

insert into public.templates (code, version, effective_date, name, pillar, template_type, description, default_content)
values
  (
    'FT-COM-001',
    '2.0',
    '2026-01-15',
    'Propuesta Técnico-Económica Integral Taltum',
    'transversal',
    'cotizacion',
    'Formato estándar de cotización corporativa de Taltum con alcance técnico, entregables y condiciones comerciales.',
    'Presentamos nuestra propuesta de acompañamiento integral orientada a proteger legalmente su operación, fortalecer el bienestar de su talento y optimizar la productividad de su organización.'
  ),
  (
    'FT-SST-001',
    '1.3',
    '2026-01-15',
    'Informe de Diagnóstico de Estándares Mínimos (Res. 0312)',
    'sg_sst',
    'diagnostico',
    'Formato controlado para evaluar el porcentaje de cumplimiento normativo del SG-SST según número de trabajadores y clase de riesgo.',
    'Se realiza verificación documental y operativa frente a los criterios de la Resolución 0312 de 2019 y el Decreto 1072 de 2015.'
  ),
  (
    'FT-SST-002',
    '1.1',
    '2026-02-01',
    'Acta de Visita e Inspección Técnica SST',
    'sg_sst',
    'acta',
    'Registro formal de visita empresarial, temas tratados, compromisos adquiridos y verificación de controles en sitio.',
    'Durante el recorrido técnico en las instalaciones de la empresa se revisaron condiciones de seguridad, soportes vigentes del SG-SST y seguimiento a compromisos previos.'
  ),
  (
    'FT-FSO-001',
    '1.2',
    '2026-02-10',
    'Informe Clínico de Evaluación Ergonómica de Puestos de Trabajo',
    'fisioterapia',
    'reporte',
    'Formato clínico para análisis biomecánico postural, mobiliario, carga física y recomendaciones ergonómicas.',
    'Evaluación biomecánica en sitio orientada a identificar factores de riesgo por carga estática, movimientos repetitivos e higiene postural.'
  ),
  (
    'FT-GHU-001',
    '1.0',
    '2026-03-01',
    'Informe Ejecutivo de Clima Organizacional y Retención de Talento',
    'gestion_humana',
    'reporte',
    'Estructura estándar de hallazgos en liderazgo, comunicación, sentido de pertenencia y plan de intervención de talento.',
    'Diagnóstico integral de percepción del clima laboral, factores de rotación y oportunidades de fortalecimiento cultural.'
  )
on conflict (code) do nothing;
