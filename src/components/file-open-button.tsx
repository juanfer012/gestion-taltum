"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { getConsultantFileSignedUrlAction } from "@/app/actions";

export function FileOpenButton({ storagePath }: { storagePath: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const res = await getConsultantFileSignedUrlAction(storagePath);
          if ("url" in res && res.url) {
            window.open(res.url, "_blank", "noopener,noreferrer");
          } else if ("error" in res) {
            alert(res.error);
          }
        });
      }}
      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-border-soft bg-white px-3 py-2 text-xs font-semibold text-petrol transition hover:bg-bone-warm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
    >
      <Download className="h-3.5 w-3.5 shrink-0 text-petrol" />
      <span>{isPending ? "Abriendo..." : "Abrir"}</span>
    </button>
  );
}
