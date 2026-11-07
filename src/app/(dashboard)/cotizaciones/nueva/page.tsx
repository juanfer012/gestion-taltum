import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QuoteBuilder } from "@/components/quote-builder";
import type { Service } from "@/lib/types";

export default async function NuevaCotizacionPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [companiesRes, servicesRes, templatesRes, countRes] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, nit, risk_level, employee_count")
      .order("name", { ascending: true }),
    supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("pillar", { ascending: true }),
    supabase
      .from("templates")
      .select("id, code, version, name, default_content")
      .eq("template_type", "cotizacion")
      .eq("is_active", true),
    supabase.from("quotes").select("id", { count: "exact", head: true }),
  ]);

  const nextSeq = String((countRes.count ?? 0) + 1).padStart(3, "0");
  const year = new Date().getFullYear();
  const suggestedNumber = `COT-${year}-${nextSeq}`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/cotizaciones"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-soft hover:text-petrol"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Cotizaciones
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-petrol">
          Nueva Propuesta Técnico-Económica
        </h1>
        <p className="text-sm text-gray-soft">
          Selecciona la empresa, elige servicios del portafolio Taltum o ítems a
          la medida y genera el documento membretado.
        </p>
      </div>

      {(companiesRes.data ?? []).length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Primero registra una empresa cliente para poder emitirle una
          cotización.{" "}
          <Link
            href="/empresas?nueva=1"
            className="font-bold underline text-petrol"
          >
            Ir a crear empresa →
          </Link>
        </div>
      ) : (
        <QuoteBuilder
          companies={companiesRes.data ?? []}
          services={(servicesRes.data ?? []) as Service[]}
          templates={templatesRes.data ?? []}
          defaultCompanyId={params.empresa}
          suggestedNumber={suggestedNumber}
        />
      )}
    </div>
  );
}
