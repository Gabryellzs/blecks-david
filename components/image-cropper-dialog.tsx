// components/image-cropper-dialog.tsx
"use client"

import { Label } from "@/components/ui/label"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { getCroppedImage } from "@/utils/cropImage" // Importar a função utilitária

interface ImageCropperDialogProps {
  imageSrc: string
  isOpen: boolean
  onClose: () => void
  onCropComplete: (croppedBlob: Blob | null) => void
}

export default function ImageCropperDialog({ imageSrc, isOpen, onClose, onCropComplete }: ImageCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop)
  }, [])

  const onZoomChange = useCallback((zoom: number[]) => {
    setZoom(zoom[0])
  }, [])

  const onRotationChange = useCallback((rotation: number[]) => {
    setRotation(rotation[0])
  }, [])

  const onCropCompleteCallback = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCrop = useCallback(async () => {
    if (croppedAreaPixels && imageSrc) {
      try {
        const croppedBlob = await getCroppedImage(imageSrc, croppedAreaPixels, rotation)
        onCropComplete(croppedBlob)
        onClose()
      } catch (e) {
        console.error("Erro ao cortar a imagem:", e)
        onCropComplete(null) // Sinaliza erro no corte
        onClose()
      }
    }
  }, [croppedAreaPixels, imageSrc, rotation, onCropComplete, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Recortar Imagem de Perfil</DialogTitle>
        </DialogHeader>
        <div className="relative flex-grow w-full">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1 / 1} // Forçar aspecto 1:1 (quadrado)
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onRotationChange={onRotationChange}
            onCropComplete={onCropCompleteCallback}
            cropShape="round" // Para um avatar circular
            showGrid={false}
            restrictPosition={false}
          />
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="zoom-slider" className="w-12">
              Zoom:
            </Label>
            <Slider
              id="zoom-slider"
              min={1}
              max={3}
              step={0.1}
              value={[zoom]}
              onValueChange={onZoomChange}
              className="flex-grow"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="rotation-slider" className="w-12">
              Rotação:
            </Label>
            <Slider
              id="rotation-slider"
              min={0}
              max={360}
              step={1}
              value={[rotation]}
              onValueChange={onRotationChange}
              className="flex-grow"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleCrop}>Recortar e Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
