"use client"

import { useEffect, useState, memo, useRef } from "react"
import { motion } from "framer-motion"

const placas = [
  {
    id: 1,
    titulo: "100 Mil",
    img: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2020%20de%20jun.%20de%202025%2C%2023_58_20-Photoroom-XRgYJ2arP6zTlrBxDEV8d8YGtESW1G.png",
  },
  {
    id: 2,
    titulo: "500 Mil",
    img: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2020%20de%20jun.%20de%202025%2C%2023_58_24-Photoroom-ckHFRRYhVOHc071WcjjaHQljjr6ya0.png",
  },
  {
    id: 3,
    titulo: "1 Milhão",
    img: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2020%20de%20jun.%20de%202025%2C%2023_05_48-Photoroom-78pl5dqc8UtiqAQKvwN7t5lt38HeJa.png",
  },
]

const PlacasPremiacao = memo(function PlacasPremiacao() {
  const [ordem, setOrdem] = useState([2, 0, 1])
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Só considera a seção "ativa" quando estiver visível na tela
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.2 },
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  // Rotaciona as placas apenas quando visível
  useEffect(() => {
    if (!isVisible) return

    const intervalo = setInterval(() => {
      setOrdem((prev) => {
        const nova = [...prev]
        const primeiro = nova.shift()
        if (primeiro === undefined) return prev
        nova.push(primeiro)
        return nova
      })
    }, 10000)

    return () => clearInterval(intervalo)
  }, [isVisible])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380px] md:h-[430px] lg:h-[460px] flex items-end justify-center"
    >
      {ordem.map((i, pos) => {
        const zIndex = 10 - pos

        // posição e escala de cada placa (centro / esquerda / direita)
        const transform = {
          0: { scale: 1, x: 0, y: 0 },
          1: { scale: 0.9, x: -180, y: 0 },
          2: { scale: 0.9, x: 180, y: 0 },
        } as const

        const current = transform[pos as 0 | 1 | 2]

        return (
          <motion.img
            key={placas[i].id}
            src={placas[i].img}
            alt={placas[i].titulo}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{
              opacity: 1,
              scale: current.scale,
              x: current.x,
              y: current.y,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-64 md:w-72 h-auto rounded-xl shadow-2xl"
            style={{ zIndex, willChange: "transform, opacity" }}
            loading="lazy"
          />
        )
      })}
    </div>
  )
})

export default PlacasPremiacao
