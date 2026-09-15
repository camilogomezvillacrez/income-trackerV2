/**
 * Reduce la foto antes de subirla. Tres razones: una foto de celular pesa 3-6 MB
 * y por datos móviles tarda una eternidad; Claude rechaza imágenes muy grandes;
 * y pasar por canvas convierte el HEIC del iPhone a JPEG, que Claude sí lee.
 */
const MAX_SIDE = 1600;
const QUALITY = 0.85;

export async function resizeForUpload(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY)
  );
  if (!blob) throw new Error("No se pudo procesar la imagen");

  return new File([blob], "recibo.jpg", { type: "image/jpeg" });
}
