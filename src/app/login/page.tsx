"use client";

import { useActionState } from "react";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { loginAction } from "@/app/actions";
import { TaltumLogo } from "@/components/taltum-logo";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-dvh flex flex-col lg:grid lg:grid-cols-12 bg-bone-white">
      {/* Banner superior corporativo para Celular y Tablet (< 1024px) */}
      <div className="lg:hidden bg-petrol px-6 py-6 sm:px-10 sm:py-8 text-white border-b border-dorado/30">
        <div className="mx-auto max-w-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TaltumLogo variant="light" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-dorado/40 bg-dorado/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-dorado-light">
              <ShieldCheck className="h-3.5 w-3.5" />
              Uso Interno
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
            Entorno privado de consultoría para SG-SST, Gestión Humana y
            Fisioterapia Especializada.
          </p>
        </div>
      </div>

      {/* Columna izquierda de marca para Tablet Horizontal y Escritorio (>= 1024px) */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-petrol p-12 text-white relative overflow-hidden">
        <div className="relative z-10">
          <TaltumLogo variant="light" />
        </div>

        <div className="relative z-10 space-y-6 my-auto py-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-dorado/40 bg-dorado/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-dorado-light">
            <ShieldCheck className="h-3.5 w-3.5" />
            Acceso Interno Exclusivo
          </span>
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
            Gestión integral de clientes, formatos y entregables corporativos.
          </h1>
          <p className="text-sm text-white/75 leading-relaxed">
            Centraliza empresas, diagnósticos Res. 0312, cotizaciones, reportes
            clínicos/técnicos y enlaces seguros de entrega para tus clientes en
            un solo entorno privado.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
            <div>
              <div className="text-lg font-bold text-dorado-light">SG-SST</div>
              <div className="text-white/65">Rigor normativo</div>
            </div>
            <div>
              <div className="text-lg font-bold text-dorado-light">GH</div>
              <div className="text-white/65">Talento y clima</div>
            </div>
            <div>
              <div className="text-lg font-bold text-dorado-light">Fisio</div>
              <div className="text-white/65">Ergonomía clínica</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-white/50">
          <span>© {new Date().getFullYear()} Taltum.co</span>
          <span>Medellín, Colombia</span>
        </div>
      </div>

      {/* Columna formulario */}
      <div className="flex-1 lg:col-span-7 flex items-center justify-center px-4 py-8 sm:p-12">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-petrol">
              Iniciar sesión en Gestión Taltum
            </h2>
            <p className="mt-1.5 text-sm text-gray-soft">
              Ingresa con tu cuenta autorizada de consultoría interna.
            </p>
          </div>

          <form
            action={formAction}
            className="space-y-5 rounded-2xl border border-border-soft bg-white p-6 sm:p-8 shadow-xs"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-premium"
              >
                Correo corporativo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder="admin1@taltum.co"
                className="mt-1.5 w-full rounded-xl border border-border-soft bg-bone-white/60 px-4 py-3 text-base lg:text-sm text-petrol placeholder:text-gray-soft/70 focus:border-petrol focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-premium"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="mt-1.5 w-full rounded-xl border border-border-soft bg-bone-white/60 px-4 py-3 text-base lg:text-sm text-petrol placeholder:text-gray-soft/70 focus:border-petrol focus:bg-white focus:outline-none"
              />
            </div>

            {state?.error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full min-h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-dorado px-4 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-dorado-dark active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {isPending ? "Verificando acceso..." : "Ingresar al Panel"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-gray-soft text-center">
              <Lock className="h-3.5 w-3.5 shrink-0 text-dorado" />
              <span>Plataforma privada para consultoras autorizadas</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
