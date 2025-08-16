// utils/cropImage.ts
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.setAttribute("crossOrigin", "anonymous") // Necessário para evitar problemas de CORS
    image.src = url
  })

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Retorna o blob da imagem cortada.
 * @param {string} imageSrc - URL da imagem.
 * @param {Object} pixelCrop - Objeto com x, y, width, height do corte em pixels.
 * @param {number} rotation - Rotação da imagem em graus.
 */
export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    return null
  }

  const rotationRadian = getRadianAngle(rotation)

  // Definir o tamanho do canvas para o tamanho da imagem cortada
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Traduzir o contexto para o centro do canvas para rotação
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rotationRadian)
  ctx.scale(1, 1) // Manter escala original
  ctx.translate(-canvas.width / 2, -canvas.height / 2)

  // Desenhar a imagem cortada no canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  // Retornar a imagem como um blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, "image/png") // Você pode mudar para 'image/jpeg' se preferir
  })
}
