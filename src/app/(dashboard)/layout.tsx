import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    redirect("/login");
  }

  const consultantName =
    profile?.full_name ??
    (user.email === "admin1@taltum.co"
      ? "Consultora Principal"
      : user.email === "admin2@taltum.co"
        ? "Consultora Asociada"
        : user.email?.split("@")[0] ?? "Consultora Taltum");

  const consultantEmail = profile?.email ?? user.email ?? "";

  return (
    <div className="min-h-dvh bg-bone-white">
      <SidebarNav
        consultantName={consultantName}
        consultantEmail={consultantEmail}
      />
      <main className="md:pl-20 lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 pt-5 pb-28 sm:px-6 md:py-7 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
