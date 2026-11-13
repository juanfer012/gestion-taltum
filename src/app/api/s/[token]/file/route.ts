import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TOKEN_REGEX = /^[0-9a-f]{24,64}$/i;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const cleanToken = (token ?? "").trim().toLowerCase();

  if (!TOKEN_REGEX.test(cleanToken)) {
    return new NextResponse("Enlace inválido.", { status: 400 });
  }

  const supabase = await createClient();
  const { data: signedUrl, error } = await supabase.rpc(
    "get_shared_file_download_url",
    {
      p_token: cleanToken,
    }
  );

  if (error || !signedUrl || typeof signedUrl !== "string") {
    return new NextResponse(
      "Este enlace ha sido revocado, ha expirado o no tiene descarga autorizada.",
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
        },
      }
    );
  }

  // Asegurar que la URL firmada provenga únicamente del host oficial de Supabase
  const expectedOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (expectedOrigin && !signedUrl.startsWith(expectedOrigin)) {
    return new NextResponse("Origen de almacenamiento no válido.", {
      status: 403,
    });
  }

  const upstream = await fetch(signedUrl, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("No fue posible recuperar el documento.", {
      status: 404,
    });
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";
  const contentLength = upstream.headers.get("content-length");
  const forceDownload = request.nextUrl.searchParams.get("download") === "1";

  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": forceDownload ? "attachment" : "inline",
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });

  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers,
  });
}
