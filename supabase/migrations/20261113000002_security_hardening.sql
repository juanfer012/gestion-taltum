-- ============================================================================
-- TALTUM — Security Hardening (RLS, Storage MIME & Path Validation, RPCs)
-- ============================================================================

-- 1. Restrict MIME types in private bucket 'taltum-files' to safe business documents & images
update storage.buckets
set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
where id = 'taltum-files';

-- 2. Harden storage.objects RLS policies against path traversal and unauthorized prefixes
alter policy "Consultants read taltum-files"
on storage.objects
using (
  bucket_id = 'taltum-files'
  and public.is_active_consultant()
  and position('..' in name) = 0
  and (
    name like 'companies/%'
    or name like 'reports/%'
    or name like 'templates/%'
  )
);

alter policy "Consultants upload taltum-files"
on storage.objects
with check (
  bucket_id = 'taltum-files'
  and public.is_active_consultant()
  and position('..' in name) = 0
  and (
    name like 'companies/%'
    or name like 'reports/%'
    or name like 'templates/%'
  )
);

alter policy "Consultants update taltum-files"
on storage.objects
using (
  bucket_id = 'taltum-files'
  and public.is_active_consultant()
  and position('..' in name) = 0
)
with check (
  bucket_id = 'taltum-files'
  and public.is_active_consultant()
  and position('..' in name) = 0
  and (
    name like 'companies/%'
    or name like 'reports/%'
    or name like 'templates/%'
  )
);

alter policy "Consultants delete taltum-files"
on storage.objects
using (
  bucket_id = 'taltum-files'
  and public.is_active_consultant()
  and position('..' in name) = 0
  and (
    name like 'companies/%'
    or name like 'reports/%'
    or name like 'templates/%'
  )
);

-- 3. Lock down legacy_archive schema & add missing FK indexes
revoke all on schema legacy_archive from public, anon, authenticated;
revoke all on all tables in schema legacy_archive from public, anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    '_prisma_migrations',
    'legacy_prisma_appointments',
    'legacy_prisma_audit_logs',
    'legacy_prisma_availabilities',
    'legacy_prisma_blog_posts',
    'legacy_prisma_companies',
    'legacy_prisma_leads',
    'legacy_prisma_payments',
    'legacy_prisma_purchases',
    'legacy_prisma_services',
    'legacy_prisma_time_offs',
    'legacy_prisma_users'
  ]
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'legacy_archive'
        and tablename = t
        and policyname = 'Deny all access to legacy archive'
    ) then
      execute format(
        'create policy "Deny all access to legacy archive" on legacy_archive.%I as restrictive for all to public using (false) with check (false)',
        t
      );
    end if;
  end loop;
end $$;

create index if not exists idx_legacy_appointments_service_id on legacy_archive.legacy_prisma_appointments ("serviceId");
create index if not exists idx_legacy_appointments_user_id on legacy_archive.legacy_prisma_appointments ("userId");
create index if not exists idx_legacy_audit_logs_actor_id on legacy_archive.legacy_prisma_audit_logs ("actorId");
create index if not exists idx_legacy_payments_purchase_id on legacy_archive.legacy_prisma_payments ("purchaseId");
create index if not exists idx_legacy_purchases_service_id on legacy_archive.legacy_prisma_purchases ("serviceId");
create index if not exists idx_legacy_purchases_user_id on legacy_archive.legacy_prisma_purchases ("userId");

-- 4. Harden get_shared_resource RPC:
--    - Validate token format (hex string 24..64 chars)
--    - Do NOT expose internal storage_path to anonymous callers
--    - Deduplicate view counter increments within 60 seconds per user_agent
create or replace function public.get_shared_resource(
  p_token text,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.share_links%rowtype;
  v_company jsonb;
  v_payload jsonb;
  v_recent_view boolean;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{24,64}$' then
    return jsonb_build_object('error', 'LINK_NOT_FOUND', 'message', 'El enlace compartido no existe o no es válido.');
  end if;

  select *
  into v_link
  from public.share_links
  where token = p_token
  limit 1;

  if not found then
    return jsonb_build_object('error', 'LINK_NOT_FOUND', 'message', 'El enlace compartido no existe.');
  end if;

  if not v_link.is_active then
    return jsonb_build_object('error', 'LINK_REVOKED', 'message', 'Este enlace fue desactivado por el consultor de Taltum.');
  end if;

  if v_link.expires_at is not null and v_link.expires_at < now() then
    return jsonb_build_object('error', 'LINK_EXPIRED', 'message', 'Este enlace ha expirado. Solicita uno nuevo a tu consultora Taltum.');
  end if;

  select exists (
    select 1
    from public.share_view_logs
    where share_link_id = v_link.id
      and coalesce(user_agent, '') = coalesce(left(p_user_agent, 500), '')
      and viewed_at > now() - interval '60 seconds'
  ) into v_recent_view;

  if not v_recent_view then
    update public.share_links
    set
      views_count = views_count + 1,
      last_viewed_at = now()
    where id = v_link.id;

    insert into public.share_view_logs (share_link_id, user_agent)
    values (v_link.id, left(p_user_agent, 500));
  end if;

  select jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'nit', c.nit,
    'city', c.city,
    'industry', c.industry,
    'contact_name', c.contact_name
  )
  into v_company
  from public.companies c
  where c.id = v_link.company_id;

  if v_link.resource_type = 'file' then
    select jsonb_build_object(
      'id', f.id,
      'title', f.title,
      'category', f.category,
      'description', f.description,
      'file_name', f.file_name,
      'mime_type', f.mime_type,
      'size_bytes', f.size_bytes,
      'created_at', f.created_at
    )
    into v_payload
    from public.company_files f
    where f.id = v_link.file_id;

  elsif v_link.resource_type = 'report' then
    select jsonb_build_object(
      'id', r.id,
      'report_number', r.report_number,
      'title', r.title,
      'category', r.category,
      'report_date', r.report_date,
      'status', r.status,
      'summary', r.summary,
      'content_sections', r.content_sections,
      'findings', r.findings,
      'recommendations', r.recommendations,
      'has_attachment', (r.attachment_storage_path is not null),
      'attachment_name', r.attachment_name,
      'author_name', coalesce(p.full_name, 'Consultora Taltum'),
      'author_role', coalesce(p.role_title, 'Especialista SG-SST & Fisioterapia'),
      'author_license', p.license_sst
    )
    into v_payload
    from public.reports r
    left join public.profiles p on p.id = r.created_by
    where r.id = v_link.report_id;

  elsif v_link.resource_type = 'quote' then
    select jsonb_build_object(
      'id', q.id,
      'quote_number', q.quote_number,
      'title', q.title,
      'status', q.status,
      'valid_until', q.valid_until,
      'subtotal', q.subtotal,
      'tax_rate', q.tax_rate,
      'tax_amount', q.tax_amount,
      'total', q.total,
      'currency', q.currency,
      'notes', q.notes,
      'payment_terms', q.payment_terms,
      'created_at', q.created_at,
      'items', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', qi.id,
            'description', qi.description,
            'details', qi.details,
            'quantity', qi.quantity,
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
    return jsonb_build_object('error', 'RESOURCE_MISSING', 'message', 'El documento asociado ya no se encuentra disponible.');
  end if;

  return jsonb_build_object(
    'link', jsonb_build_object(
      'id', v_link.id,
      'title', v_link.title,
      'message', v_link.message,
      'resource_type', v_link.resource_type,
      'allow_download', v_link.allow_download,
      'expires_at', v_link.expires_at,
      'views_count', v_link.views_count + (case when v_recent_view then 0 else 1 end),
      'created_at', v_link.created_at
    ),
    'company', v_company,
    'resource', v_payload
  );
end;
$$;

-- 5. Dedicated server-side download RPC that validates active link + allow_download in real time
create or replace function public.get_shared_file_download_url(
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.share_links%rowtype;
  v_storage_path text;
  v_file_name text;
  v_mime_type text;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{24,64}$' then
    return jsonb_build_object('error', 'INVALID_TOKEN');
  end if;

  select *
  into v_link
  from public.share_links
  where token = p_token
  limit 1;

  if not found or not v_link.is_active then
    return jsonb_build_object('error', 'LINK_INACTIVE');
  end if;

  if v_link.expires_at is not null and v_link.expires_at < now() then
    return jsonb_build_object('error', 'LINK_EXPIRED');
  end if;

  if not v_link.allow_download then
    return jsonb_build_object('error', 'DOWNLOAD_DISABLED');
  end if;

  if v_link.resource_type = 'file' and v_link.file_id is not null then
    select f.storage_path, f.file_name, f.mime_type
    into v_storage_path, v_file_name, v_mime_type
    from public.company_files f
    where f.id = v_link.file_id;
  elsif v_link.resource_type = 'report' and v_link.report_id is not null then
    select r.attachment_storage_path, r.attachment_name, 'application/pdf'
    into v_storage_path, v_file_name, v_mime_type
    from public.reports r
    where r.id = v_link.report_id;
  end if;

  if v_storage_path is null then
    return jsonb_build_object('error', 'FILE_NOT_FOUND');
  end if;

  return jsonb_build_object(
    'storage_path', v_storage_path,
    'file_name', coalesce(v_file_name, 'documento-taltum.pdf'),
    'mime_type', coalesce(v_mime_type, 'application/octet-stream')
  );
end;
$$;

grant execute on function public.get_shared_file_download_url(text) to anon, authenticated;

-- 6. Harden respond_shared_quote with token format check & audit trail log
create or replace function public.respond_shared_quote(
  p_token text,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.share_links%rowtype;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{24,64}$' then
    return jsonb_build_object('error', 'Token inválido');
  end if;

  if p_decision not in ('aprobada', 'rechazada') then
    return jsonb_build_object('error', 'Decisión inválida');
  end if;

  select * into v_link
  from public.share_links
  where token = p_token
    and is_active = true
    and resource_type = 'quote'
    and (expires_at is null or expires_at > now())
  limit 1;

  if not found or v_link.quote_id is null then
    return jsonb_build_object('error', 'Enlace no válido o expirado');
  end if;

  update public.quotes
  set status = p_decision::public.quote_status,
      updated_at = now()
  where id = v_link.quote_id
    and status in ('borrador', 'enviada');

  insert into public.share_view_logs (share_link_id, user_agent)
  values (v_link.id, '[DECISION_CLIENTE:' || upper(p_decision) || ']');

  return jsonb_build_object('success', true, 'status', p_decision);
end;
$$;
