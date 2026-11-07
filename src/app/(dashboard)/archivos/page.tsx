import Link from "next/link";
import { Eye, FolderLock, Link2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteFileAction } from "@/app/actions";
import {
  FILE_CATEGORY_LABELS,
  formatBytes,
  formatDate,
  formatDateTime,
} from "@/lib/format";
import { FileUploader } from "@/components/file-uploader";
import { FileOpenButton } from "@/components/file-open-button";
import { ShareLinkModal } from "@/components/share-link-modal";
import { ShareLinkRowActions } from "@/components/share-link-row-actions";
import type { FileCategory } from "@/lib/types";

export default async function ArchivosYEnlacesPage() {
  const supabase = await createClient();

  const [companiesRes, templatesRes, filesRes, shareLinksRes] =
    await Promise.all([
      supabase.from("companies").select("id, name").order("name"),
      supabase
        .from("templates")
        .select("id, code, name")
        .eq("is_active", true)
        .order("code"),
      supabase
        .from("files")
        .select(
          "*, companies(id, name, contact_name, contact_email, contact_phone)"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("share_links")
        .select("*, companies(id, name)")
        .order("created_at", { ascending: false }),
    ]);

  const companies = companiesRes.data ?? [];
  const files = filesRes.data ?? [];
  const shareLinks = shareLinksRes.data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-petrol">
            Repositorio Documental y Enlaces Compartidos
          </h1>
          <p className="text-sm text-gray-soft">
            Sube entregables al almacenamiento privado y controla todos los
            enlaces públicos enviados a tus clientes.
          </p>
        </div>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5">
          <a
            href="#documentos"
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border-soft bg-white px-4 py-2 text-xs font-semibold text-petrol shadow-2xs hover:border-dorado"
          >
            <FolderLock className="h-3.5 w-3.5 text-dorado" />
            Archivos ({files.length})
          </a>
          <a
            href="#enlaces"
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border-soft bg-white px-4 py-2 text-xs font-semibold text-petrol shadow-2xs hover:border-dorado"
          >
            <Link2 className="h-3.5 w-3.5 text-dorado" />
            Enlaces ({shareLinks.length})
          </a>
        </div>
      </div>

      {/* Subidor global */}
      {companies.length > 0 ? (
        <FileUploader
          companies={companies}
          templates={templatesRes.data ?? []}
        />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs text-amber-900">
          Registra al menos una empresa en{" "}
          <Link href="/empresas?nueva=1" className="font-bold underline">
            Empresas Cliente
          </Link>{" "}
          para empezar a subir archivos.
        </div>
      )}

      {/* Listado de Archivos */}
      <section
        id="documentos"
        className="scroll-mt-20 rounded-2xl border border-border-soft bg-white p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-border-soft pb-3">
          <FolderLock className="h-4 w-4 text-dorado" />
          <h2 className="text-base font-bold text-petrol">
            Documentos Almacenados ({files.length})
          </h2>
        </div>

        {files.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-soft">
            No hay documentos cargados todavía.
          </p>
        ) : (
          <div className="divide-y divide-border-soft/70">
            {files.map((f) => {
              const comp = Array.isArray(f.companies)
                ? f.companies[0]
                : f.companies;
              const removeAction = deleteFileAction.bind(
                null,
                f.id,
                f.storage_path
              );

              return (
                <div
                  key={f.id}
                  className="py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-bone-warm px-2 py-0.5 text-[10px] font-semibold text-petrol">
                        {FILE_CATEGORY_LABELS[f.category as FileCategory] ??
                          f.category}
                      </span>
                      <Link
                        href={`/empresas/${f.company_id}`}
                        className="text-xs font-bold text-dorado-dark hover:underline"
                      >
                        {comp?.name ?? "Empresa"}
                      </Link>
                      <span className="font-mono text-[11px] text-gray-soft">
                        v{f.version}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-semibold text-petrol truncate">
                      {f.title}
                    </p>
                    <p className="text-xs text-gray-soft truncate">
                      {f.file_name} · {formatBytes(f.size_bytes)} ·{" "}
                      {formatDate(f.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <FileOpenButton storagePath={f.storage_path} />
                    {comp && (
                      <ShareLinkModal
                        compact
                        companyId={comp.id}
                        companyName={comp.name}
                        contactName={comp.contact_name}
                        contactEmail={comp.contact_email}
                        contactPhone={comp.contact_phone}
                        resourceType="file"
                        resourceId={f.id}
                        resourceTitle={f.title}
                        storagePath={f.storage_path}
                      />
                    )}
                    <form action={removeAction}>
                      <button
                        type="submit"
                        title="Eliminar archivo"
                        aria-label="Eliminar archivo"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 active:scale-[0.98] cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Control de Enlaces Compartidos (/s/[token]) */}
      <section
        id="enlaces"
        className="scroll-mt-20 rounded-2xl border border-border-soft bg-white p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-border-soft pb-3">
          <Link2 className="h-4 w-4 text-dorado" />
          <h2 className="text-base font-bold text-petrol">
            Historial y Control de Enlaces Compartidos ({shareLinks.length})
          </h2>
        </div>

        {shareLinks.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-soft">
            Cuando compartas un archivo, reporte o cotización, verás aquí cuántas
            veces lo abrió el cliente y podrás revocarlo cuando quieras.
          </p>
        ) : (
          <>
            {/* Tarjetas adaptativas para Celular y Tablet Vertical (< 1024px) */}
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:hidden">
              {shareLinks.map((sl) => {
                const comp = Array.isArray(sl.companies)
                  ? sl.companies[0]
                  : sl.companies;
                return (
                  <div
                    key={sl.id}
                    className="flex flex-col justify-between rounded-xl border border-border-soft bg-bone-white/40 p-4 space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                            sl.is_active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {sl.is_active ? "Activo" : "Revocado"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white border border-border-soft px-2.5 py-0.5 text-xs font-semibold text-petrol">
                          <Eye className="h-3.5 w-3.5 text-dorado" />
                          {sl.views_count} vistas
                        </span>
                      </div>

                      <a
                        href={`/s/${sl.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm font-bold text-petrol hover:text-dorado-dark line-clamp-2"
                      >
                        {sl.label ?? sl.resource_type}
                      </a>

                      <p className="text-xs text-gray-soft">
                        {comp?.name} · Para: {sl.recipient_name || "General"}
                      </p>
                      <p className="text-[11px] text-gray-soft">
                        Expira:{" "}
                        {sl.expires_at
                          ? formatDate(sl.expires_at)
                          : "Sin vencimiento"}{" "}
                        · Última vista: {formatDateTime(sl.last_viewed_at)}
                      </p>
                    </div>

                    <div className="border-t border-border-soft pt-2.5">
                      <ShareLinkRowActions
                        id={sl.id}
                        token={sl.token}
                        isActive={sl.is_active}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabla completa para Tablet Horizontal (>= 1024px) y Escritorio */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-border-soft text-xs">
                <thead className="bg-bone-warm/60 text-left uppercase tracking-wider text-gray-soft">
                  <tr>
                    <th className="px-3 py-3">Recurso / Empresa</th>
                    <th className="px-3 py-3">Destinatario</th>
                    <th className="px-3 py-3">Aperturas</th>
                    <th className="px-3 py-3">Expira</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-3 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft/70">
                  {shareLinks.map((sl) => {
                    const comp = Array.isArray(sl.companies)
                      ? sl.companies[0]
                      : sl.companies;
                    return (
                      <tr key={sl.id}>
                        <td className="px-3 py-3">
                          <a
                            href={`/s/${sl.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-petrol hover:text-dorado-dark block"
                          >
                            {sl.label ?? sl.resource_type}
                          </a>
                          <span className="text-[11px] text-gray-soft">
                            {comp?.name} · Tipo: {sl.resource_type}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-premium">
                          {sl.recipient_name || "General"}
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-petrol">
                            <Eye className="h-3.5 w-3.5 text-dorado" />
                            {sl.views_count}
                          </span>
                          <span className="block text-[10px] text-gray-soft">
                            {formatDateTime(sl.last_viewed_at)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-soft whitespace-nowrap">
                          {sl.expires_at
                            ? formatDate(sl.expires_at)
                            : "Sin vencimiento"}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              sl.is_active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-red-200 bg-red-50 text-red-700"
                            }`}
                          >
                            {sl.is_active ? "Activo" : "Revocado"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <ShareLinkRowActions
                            id={sl.id}
                            token={sl.token}
                            isActive={sl.is_active}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
