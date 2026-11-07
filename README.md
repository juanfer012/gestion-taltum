# Taltum Gestión (`gestion.taltum.co`)

Plataforma operativa y documental interna para **Taltum** (Seguridad y Salud en el Trabajo, Gestión Humana y Fisioterapia Especializada).

## Módulos Incluidos
- **Panel Operativo (`/`)**: Indicadores en tiempo real de empresas activas, pipeline comercial en cotizaciones, reportes emitidos y aperturas de enlaces compartidos.
- **Empresas Cliente (`/empresas`, `/empresas/[id]`)**: CRM B2B con cálculo automático de Estándares Mínimos (**Resolución 0312 de 2019**: 7, 21 o 60 estándares según número de colaboradores y clase de riesgo I–V), ARL, servicios contratados y ficha 360°.
- **Servicios y Formatos Establecidos (`/servicios`)**: Portafolio de los 3 pilares de Taltum y biblioteca de formatos controlados con código, versión, vigencia y plantillas adjuntas.
- **Cotizaciones (`/cotizaciones`)**: Constructor interactivo desde el catálogo o ítems libres, cálculo de descuento/IVA, documento membretado imprimible en PDF y enlace público con opción de aprobación en un clic.
- **Reportes Técnicos (`/reportes`)**: Emisión de diagnósticos, informes ergonómicos y actas de visita sobre formatos establecidos, soporte adjunto y vista PDF.
- **Repositorio Privado y Enlaces (`/archivos`, `/s/[token]`)**: Almacenamiento privado en Supabase Storage (`taltum-files`) y enlaces compartibles con marca Taltum, vigencia configurable, revocación instantánea, envío directo a WhatsApp y conteo de aperturas.

## Desarrollo Local

```bash
npm install
npm run dev
```

Variables de entorno en `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://pflwgqjvushumvaluhkb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Despliegue en Vercel (`gestion.taltum.co`)
1. Importa este repositorio en **Vercel**.
2. Configura las variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `NEXT_PUBLIC_SITE_URL=https://gestion.taltum.co`.
3. En Vercel → **Domains**, agrega `gestion.taltum.co` y apunta el registro `CNAME` (`gestion` → `cname.vercel-dns.com`) en el DNS de `taltum.co`.
