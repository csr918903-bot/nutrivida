export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const COMMUNITY_BUCKET = "post-images";

export function validarImagem(file: Pick<File, "type" | "size">): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Escolha uma foto JPG, PNG ou WebP.";
  if (file.size > MAX_IMAGE_BYTES) return "A foto deve ter no máximo 5 MB.";
  if (file.size === 0) return "Essa imagem está vazia. Escolha outra foto.";
  return null;
}

// Mantém a foto leve, inclusive quando o navegador é o único armazenamento.
export async function prepararImagem(file: File): Promise<File> {
  const erro = validarImagem(file);
  if (erro) throw new Error(erro);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a foto. Tente outra imagem.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("Não foi possível preparar a foto. Tente outra imagem."));
      }, "image/webp", 0.8);
    });
    return new File([blob], "foto.webp", { type: blob.type });
  } catch {
    throw new Error("Não foi possível ler essa foto. Escolha uma imagem JPG, PNG ou WebP válida.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function imagemLocal(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Não foi possível salvar a foto neste navegador."));
    };
    reader.onerror = () => reject(new Error("Não foi possível salvar a foto neste navegador."));
    reader.readAsDataURL(file);
  });
}

export function salvarPostsLocais(storage: Pick<Storage, "setItem">, key: string, posts: unknown) {
  try {
    storage.setItem(key, JSON.stringify(posts));
  } catch {
    throw new Error("O navegador não tem espaço para salvar. Remova a foto ou libere espaço e tente novamente.");
  }
}