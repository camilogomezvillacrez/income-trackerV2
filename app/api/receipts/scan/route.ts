import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { todayDate } from "@/lib/utils";
import { getCategories } from "@/lib/categories";
import { extractReceipt, findExpenseMatches, ALLOWED_TYPES, MAX_IMAGE_BYTES } from "@/lib/receipts";

export const maxDuration = 60;

/**
 * Sube la foto al Blob privado y devuelve los datos que la IA leyó.
 * No escribe en la base: el usuario confirma en un formulario y recién ahí
 * se crea el gasto (POST /api/receipts).
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const form = await req.formData();
  const file = form.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No llegó ninguna imagen" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return NextResponse.json({ error: "Formato no soportado. Usa una foto JPG o PNG." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "La foto pesa demasiado. Tómala de nuevo." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const pathname = `receipts/${user.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const blob = await put(pathname, bytes, {
    access: "private",
    contentType: file.type,
    addRandomSuffix: false,
  });

  try {
    const categories = await getCategories(user.userId);
    const fields = await extractReceipt(
      bytes.toString("base64"),
      file.type as "image/jpeg" | "image/png" | "image/webp",
      categories
    );
    // Si el gasto ya estaba registrado (el atajo de Wallet lo crea al pagar),
    // el modal ofrece adjuntarle el recibo en vez de duplicarlo.
    const matches = fields.valor
      ? await findExpenseMatches(user.userId, fields.valor, fields.fecha ?? todayDate())
      : [];

    return NextResponse.json({ pathname: blob.pathname, fields, matches });
  } catch {
    // La foto ya quedó guardada: el usuario puede llenar los datos a mano.
    return NextResponse.json(
      { pathname: blob.pathname, fields: null, matches: [], error: "No pude leer el recibo. Llena los datos a mano." },
      { status: 200 }
    );
  }
}
