"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { respondSharedQuotePublicAction } from "@/app/actions";

export function PublicQuoteDecision({
  token,
  currentStatus,
}: {
  token: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  if (status === "aprobada") {
    return (
      <div className="no-print inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        Propuesta aprobada. El equipo de Taltum se pondrá en contacto contigo.
      </div>
    );
  }

  if (status === "rechazada") {
    return (
      <div className="no-print inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
        <XCircle className="h-4 w-4" />
        Propuesta marcada como no aceptada.
      </div>
    );
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const res = await respondSharedQuotePublicAction(token, "aprobada");
            if ("ok" in res && res.ok) setStatus("aprobada");
          });
        }}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-dorado px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-dorado-dark active:scale-[0.98] disabled:opacity-50 cursor-pointer"
      >
        <CheckCircle2 className="h-4 w-4" />
        Aprobar Propuesta
      </button>
    </div>
  );
}
