"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Power } from "lucide-react";
import { toggleShareLinkAction } from "@/app/actions";

export function ShareLinkRowActions({
  id,
  token,
  isActive,
}: {
  id: string;
  token: string;
  isActive: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCopy = async () => {
    const url = `${window.location.origin}/s/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border-soft bg-white px-3 py-2 text-xs font-semibold text-petrol transition hover:bg-bone-warm active:scale-[0.98] cursor-pointer"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Copiado
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copiar Link
          </>
        )}
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await toggleShareLinkAction(id, !isActive);
          });
        }}
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition active:scale-[0.98] cursor-pointer ${
          isActive
            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
        }`}
      >
        <Power className="h-3.5 w-3.5" />
        {isActive ? "Revocar" : "Reactivar"}
      </button>
    </div>
  );
}
