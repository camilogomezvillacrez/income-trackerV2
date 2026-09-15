import Anthropic from "@anthropic-ai/sdk";
import type { Row } from "@libsql/client";
import type { Category, Receipt, ReceiptFields } from "@/types";

const client = new Anthropic();

/** Formatos que Claude puede leer. El cliente redimensiona todo a JPEG antes de subir. */
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "registrar_recibo",
  description: "Registra los datos extraídos de la foto de un recibo, factura o comprobante.",
  input_schema: {
    type: "object",
    properties: {
      proveedor: { type: ["string", "null"], description: "Razón social o nombre del negocio que emite el recibo" },
      nit: { type: ["string", "null"], description: "NIT, RUT o cédula del emisor, con dígito de verificación si aparece. Solo números y guion." },
      valor: { type: ["number", "null"], description: "Total pagado en pesos colombianos, sin puntos ni símbolos. Es el TOTAL, no el subtotal." },
      iva: { type: ["number", "null"], description: "Valor del IVA si aparece desglosado" },
      fecha: { type: ["string", "null"], description: "Fecha del recibo en formato YYYY-MM-DD" },
      correo: { type: ["string", "null"], description: "Correo electrónico del emisor" },
      telefono: { type: ["string", "null"], description: "Teléfono o celular del emisor" },
      direccion: { type: ["string", "null"], description: "Dirección del emisor" },
      factura: { type: ["string", "null"], description: "Número de factura o consecutivo" },
      metodo_pago: { type: ["string", "null"], description: "Efectivo, Tarjeta débito, Tarjeta crédito, Nequi, Daviplata, etc." },
      categoria: { type: ["string", "null"], description: "La categoría de gasto más adecuada, ELEGIDA de la lista que te dan. Si ninguna encaja, null." },
      subcategoria: { type: ["string", "null"], description: "Subcategoría de la lista dada, si aplica" },
      items: {
        type: "array",
        description: "Líneas del recibo, si se alcanzan a leer",
        items: {
          type: "object",
          properties: {
            desc: { type: "string" },
            valor: { type: ["number", "null"] },
          },
          required: ["desc"],
        },
      },
      confianza: {
        type: "string",
        enum: ["alta", "media", "baja"],
        description: "Qué tan legible estaba la imagen y qué tan seguro estás de los datos",
      },
      nota: { type: ["string", "null"], description: "Descripción corta del gasto, máximo 60 caracteres" },
    },
    required: ["proveedor", "valor", "confianza"],
  },
};

function categoryList(categories: Category[]): string {
  return categories
    .filter((c) => c.tipo === "gasto")
    .map((c) => `- ${c.name}${c.subs.length ? ` (subcategorías: ${c.subs.map((s) => s.name).join(", ")})` : ""}`)
    .join("\n");
}

/**
 * Lee la foto de un recibo y devuelve los campos contables.
 * Los valores dudosos vuelven en null a propósito: el usuario confirma en un
 * formulario antes de que esto entre a la contabilidad.
 */
export async function extractReceipt(
  base64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
  categories: Category[]
): Promise<ReceiptFields> {
  const message = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 2048,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: "registrar_recibo" },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          {
            type: "text",
            text: `Extrae los datos contables de este recibo colombiano.

Categorías de gasto disponibles (elige SOLO de esta lista):
${categoryList(categories)}

Reglas:
- Los montos en Colombia usan punto como separador de miles: "45.000" son cuarenta y cinco mil pesos, no cuarenta y cinco.
- El NIT suele venir como "NIT 900.123.456-7"; devuélvelo sin puntos: "900123456-7".
- Si un dato no aparece o no lo puedes leer con seguridad, devuelve null. No adivines.
- La fecha del recibo, no la de hoy.`,
          },
        ],
      },
    ],
  });

  const block = message.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("La IA no pudo leer el recibo");
  }
  return block.input as ReceiptFields;
}

export function rowToReceipt(r: Row): Receipt {
  return {
    id: Number(r.id),
    expense_id: r.expense_id === null ? null : Number(r.expense_id),
    image_path: String(r.image_url),
    proveedor: r.proveedor === null ? null : String(r.proveedor),
    nit: r.nit === null ? null : String(r.nit),
    valor: r.valor === null ? null : Number(r.valor),
    correo: r.correo === null ? null : String(r.correo),
    telefono: r.telefono === null ? null : String(r.telefono),
    fecha: r.fecha === null ? null : String(r.fecha),
    categoria: r.categoria === null ? null : String(r.categoria),
    created_at: String(r.created_at),
  };
}
