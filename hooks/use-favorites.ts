"use client"

import { useState, useEffect } from "react"

interface UseFavoritesOptions {
  storageKey: string
}

export function useFavorites<T extends { id: string }>({ storageKey }: UseFavoritesOptions) {
  const [favorites, setFavorites] = useState<string[]>([])

  // Carregar favoritos do localStorage
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(`favorites-${storageKey}`)
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites))
      }
    } catch (error) {
      console.error(`Erro ao carregar favoritos para ${storageKey}:`, error)
      setFavorites([])
    }
  }, [storageKey])

  // Salvar favoritos no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`favorites-${storageKey}`, JSON.stringify(favorites))
    } catch (error) {
      console.error(`Erro ao salvar favoritos para ${storageKey}:`, error)
    }
  }, [favorites, storageKey])

  // Função para alternar favorito
  const toggleFavorite = (id: string) => {
    setFavorites((prevFavorites) => {
      if (prevFavorites.includes(id)) {
        return prevFavorites.filter((favId) => favId !== id)
      } else {
        return [...prevFavorites, id]
      }
    })
  }

  // Função para adicionar favorito
  const addFavorite = (id: string) => {
    setFavorites((prevFavorites) => {
      if (!prevFavorites.includes(id)) {
        return [...prevFavorites, id]
      }
      return prevFavorites
    })
  }

  // Função para remover favorito
  const removeFavorite = (id: string) => {
    setFavorites((prevFavorites) => prevFavorites.filter((favId) => favId !== id))
  }

  return {
    favorites,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    isFavorite: (id: string) => favorites.includes(id),
  }
}
