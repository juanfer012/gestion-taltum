"use client";

import { Printer } from "lucide-react";

export function PrintButton({
  label = "Exportar PDF",
}: {
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-petrol/20 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-petrol shadow-2xs transition hover:bg-bone-warm active:scale-[0.98] cursor-pointer"
    >
      <Printer className="h-4 w-4 shrink-0 text-dorado" />
      <span>{label}</span>
    </button>
  );
}
