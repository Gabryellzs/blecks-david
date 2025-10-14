"use client"

import { motion } from "framer-motion"

export default function MacbookOpening() {
  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <div className="relative w-[600px] h-[400px]">
        {/* Base do MacBook */}
        <div className="absolute bottom-0 w-full h-16 bg-gray-300 rounded-b-2xl shadow-lg" />

        {/* Tela com animação */}
        <motion.div
          initial={{ rotateX: -90 }}
          animate={{ rotateX: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          style={{
            transformOrigin: "bottom center",
          }}
          className="absolute bottom-16 left-0 w-full h-[340px] bg-gray-900 rounded-t-2xl border border-gray-700 flex justify-center items-center overflow-hidden"
        >
          <div className="relative w-full h-full p-4">
            <img
              src="/meta-ads-dashboard.png"
              alt="Dashboard Meta ADS"
              className="w-full h-full object-cover rounded-lg"
            />
            {/* Logo do Meta no canto superior esquerdo */}
            <div className="absolute top-6 left-6 w-8 h-8">
              <img src="/images/meta-logo.jpg" alt="Meta Logo" className="w-full h-full object-contain" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
