import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ReportBuilder } from "@/components/report-builder";

export default async function NuevoReportePage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    companiesRes,
    templatesRes,
    countRes,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("companies").select("id, name, nit").order("name"),
    supabase
      .from("templates")
      .select("id, code, version, name, pillar, default_content")
      .neq("template_type", "cotizacion")
      .eq("is_active", true)
      .order("code"),
    supabase.from("reports").select("id", { count: "exact", head: true }),
  ]);

  let defaultAuthor = "Consultora Especialista Taltum";
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (prof?.full_name) defaultAuthor = prof.full_name;
  }

  const nextSeq = String((countRes.count ?? 0) + 1).padStart(3, "0");
  const suggestedCode = `REP-${new Date().getFullYear()}-${nextSeq}`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/reportes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-soft hover:text-petrol"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Reportes
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-petrol">
          Nuevo Reporte Técnico / Acta de Visita
        </h1>
        <p className="text-sm text-gray-soft">
          Elige uno de los formatos establecidos de Taltum para prellenar la
          estructura y emitir un informe listo para compartir.
        </p>
      </div>

      {(companiesRes.data ?? []).length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Registra primero una empresa cliente antes de emitir un reporte.{" "}
          <Link href="/empresas?nueva=1" className="font-bold underline">
            Ir a Empresas →
          </Link>
        </div>
      ) : (
        <ReportBuilder
          companies={companiesRes.data ?? []}
          templates={templatesRes.data ?? []}
          defaultCompanyId={params.empresa}
          suggestedCode={suggestedCode}
          defaultAuthorName={defaultAuthor}
        />
      )}
    </div>
  );
}
