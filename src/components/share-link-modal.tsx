"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  MessageCircle,
  Send,
  Share2,
  X,
} from "lucide-react";
import { createShareLinkAction } from "@/app/actions";
import { buildWhatsAppShareUrl } from "@/lib/format";
import type { ShareResourceType } from "@/lib/types";

interface ShareLinkModalProps {
  companyId: string;
  companyName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  resourceType: ShareResourceType;
  resourceId: string;
  resourceTitle: string;
  storagePath?: string | null;
  compact?: boolean;
}

export function ShareLinkModal({
  companyId,
  companyName,
  contactName,
  contactEmail,
  contactPhone,
  resourceType,
  resourceId,
  resourceTitle,
  storagePath,
  compact = false,
}: ShareLinkModalProps) {
  const [open, setOpen] = useState(false);
  const [recipientName, setRecipientName] = useState(contactName ?? "");
  const [recipientEmail, setRecipientEmail] = useState(contactEmail ?? "");
  const [expiresInDays, setExpiresInDays] = useState<string>("30");
  const [allowDownload, setAllowDownload] = useState(true);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const days = expiresInDays === "never" ? null : Number(expiresInDays);
      const res = await createShareLinkAction({
        company_id: companyId,
        resource_type: resourceType,
        resource_id: resourceId,
        storage_path: storagePath ?? null,
        label: resourceTitle,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        allow_download: allowDownload,
        expires_in_days: days,
      });

      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL ?? "https://gestion.taltum.co";

      setGeneratedUrl(`${origin}/s/${res.token}`);
    });
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!generatedUrl || typeof navigator.share !== "function") return;
    try {
      await navigator.share({
        title: `Taltum — ${resourceTitle}`,
        text: `Hola ${recipientName || contactName || ""}, te compartimos de parte de Taltum el documento "${resourceTitle}" para ${companyName}:`,
        url: generatedUrl,
      });
    } catch {
      // Cancelado por el usuario
    }
  };

  const whatsAppUrl = generatedUrl
    ? buildWhatsAppShareUrl({
        phone: contactPhone,
        recipientName: recipientName || contactName,
        companyName,
        resourceTitle,
        shareUrl: generatedUrl,
      })
    : "#";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setGeneratedUrl(null);
          setError(null);
          setOpen(true);
        }}
        className={
          compact
            ? "no-print inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-dorado/40 bg-dorado/10 px-3 py-2 text-xs font-semibold text-petrol transition hover:bg-dorado/20 active:scale-[0.98] cursor-pointer"
            : "no-print inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-dorado px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-dorado-dark active:scale-[0.98] cursor-pointer"
        }
      >
        <Share2 className="h-3.5 w-3.5 shrink-0" />
        <span>{compact ? "Compartir" : "Compartir al Cliente"}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-petrol-dark/65 p-0 sm:p-4 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full sm:max-w-lg overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border-soft bg-white p-5 sm:p-6 pb-safe shadow-2xl"
          >
            {/* Indicador visual tipo sheet en celular */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border-soft sm:hidden" />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-dorado">
                  <Link2 className="h-3.5 w-3.5" />
                  Enlace Seguro con Marca Taltum
                </span>
                <h3 className="mt-1 text-lg font-bold text-petrol truncate">
                  Compartir con {companyName}
                </h3>
                <p className="text-xs text-gray-soft line-clamp-1">
                  {resourceTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-soft hover:bg-bone-warm hover:text-petrol cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!generatedUrl ? (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-premium">
                      Destinatario
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Ej. María Gómez"
                      className="mt-1 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-sm focus:border-petrol focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-premium">
                      Vigencia del enlace
                    </label>
                    <select
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3.5 py-2.5 text-sm focus:border-petrol focus:outline-none"
                    >
                      <option value="7">7 días</option>
                      <option value="15">15 días</option>
                      <option value="30">30 días</option>
                      <option value="90">90 días</option>
                      <option value="never">Sin vencimiento</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-premium">
                    Correo de referencia (opcional)
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="cliente@empresa.com"
                    className="mt-1 w-full rounded-xl border border-border-soft px-3.5 py-2.5 text-sm focus:border-petrol focus:outline-none"
                  />
                </div>

                {resourceType !== "quote" && (
                  <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border-soft bg-bone-white/60 px-3.5 py-2.5 text-sm text-gray-premium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowDownload}
                      onChange={(e) => setAllowDownload(e.target.checked)}
                      className="h-5 w-5 shrink-0 rounded border-border-soft accent-petrol"
                    />
                    <span>Permitir descarga directa del archivo adjunto</span>
                  </label>
                )}

                {error && (
                  <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                    {error}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="min-h-11 rounded-xl border border-border-soft px-4 py-2.5 text-sm font-medium text-gray-premium hover:bg-bone-warm cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleCreate}
                    className="min-h-11 rounded-xl bg-petrol px-5 py-2.5 text-sm font-semibold text-white hover:bg-petrol-light disabled:opacity-50 cursor-pointer"
                  >
                    {isPending ? "Generando..." : "Generar Link Público"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900">
                  ¡Enlace activo! El cliente podrá verlo sin iniciar sesión y se
                  registrará automáticamente cada apertura.
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    readOnly
                    value={generatedUrl}
                    className="w-full rounded-xl border border-border-soft bg-bone-white px-3.5 py-2.5 text-xs font-mono text-petrol"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-petrol px-4 py-2.5 text-xs font-semibold text-white hover:bg-petrol-light cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-dorado-light" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copiar enlace
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:opacity-95"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar por WhatsApp
                  </a>
                  <a
                    href={generatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-petrol/20 px-3.5 py-2.5 text-xs font-semibold text-petrol transition hover:bg-bone-warm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Previsualizar Vista Cliente
                  </a>
                </div>

                {canNativeShare && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dorado/40 bg-dorado/10 px-3.5 py-2.5 text-xs font-semibold text-petrol transition hover:bg-dorado/20 cursor-pointer"
                  >
                    <Send className="h-4 w-4 text-dorado-dark" />
                    Compartir desde Tablet / Celular (AirDrop, Correo, Teams...)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
