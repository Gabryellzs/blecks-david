"use client"

import { useEffect, useState, memo } from "react"
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

  useEffect(() => {
    const intervalo = setInterval(() => {
      setOrdem((prev) => {
        const nova = [...prev]
        nova.push(nova.shift()!)
        return nova
      })
    }, 10000)

    return () => clearInterval(intervalo)
  }, [])

  return (
    <div className="relative w-full h-[450px] flex items-end justify-center">
      {ordem.map((i, pos) => {
        const zIndex = 10 - pos

        const transform = {
          0: { scale: 1, x: 0, y: 0 },
          1: { scale: 0.9, x: -200, y: 0 },
          2: { scale: 0.85, x: 200, y: 0 },
        }

        return (
          <motion.img
            key={placas[i].id}
            src={placas[i].img}
            alt={placas[i].titulo}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              scale: transform[pos as keyof typeof transform].scale,
              x: transform[pos as keyof typeof transform].x,
              y: transform[pos as keyof typeof transform].y,
            }}
            transition={{ duration: 0.8 }}
            className="absolute w-72 h-auto rounded-xl shadow-2xl"
            style={{ zIndex, willChange: "transform, opacity" }}
            loading="lazy"
          />
        )
      })}
    </div>
  )
})

export default PlacasPremiacao
