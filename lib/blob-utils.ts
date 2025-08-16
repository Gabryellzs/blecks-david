import { put } from "@vercel/blob"

export async function uploadImage(file: File) {
  try {
    if (!file) {
      return { success: false, error: "Nenhum arquivo fornecido" }
    }

    // Verificar se é uma imagem
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "O arquivo deve ser uma imagem" }
    }

    // Limitar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "A imagem deve ter menos de 5MB" }
    }

    // Fazer upload para o Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
    })

    return { success: true, url: blob.url }
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error)
    return { success: false, error: "Erro ao fazer upload da imagem" }
  }
}
