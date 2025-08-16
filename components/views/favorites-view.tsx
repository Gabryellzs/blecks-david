"use client"

import { useState, useEffect } from "react"
import { Star, Pen, Calendar, Package, X, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFavorites } from "@/hooks/use-favorites"
import { cn } from "@/lib/utils"

// Interfaces para os diferentes tipos de itens
interface Note {
  id: string
  title: string
  content: string
  date: string
  color?: string
}

interface CalendarNote {
  id: string
  date: string
  title: string
  content: string
}

interface Product {
  id: string
  name: string
  description: string
  features?: string
  targetAudience?: string
  price?: string
  createdAt: string
  color?: string
  coverImage?: string
  files: any[]
}

export default function FavoritesView() {
  // Estados para os diferentes tipos de itens
  const [notes, setNotes] = useState<Note[]>([])
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Hooks de favoritos
  const { favorites: favoriteNotes, toggleFavorite: toggleNotesFavorite } = useFavorites<Note>({ storageKey: "notes" })
  const { favorites: favoriteCalendarNotes, toggleFavorite: toggleCalendarFavorite } = useFavorites<CalendarNote>({
    storageKey: "calendar-notes",
  })
  const { favorites: favoriteProducts, toggleFavorite: toggleProductsFavorite } = useFavorites<Product>({
    storageKey: "products",
  })

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      // Carregar notas
      const storedNotes = localStorage.getItem("notes")
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes))
      }

      // Carregar anotações do calendário
      const storedCalendarNotes = localStorage.getItem("calendar-notes")
      if (storedCalendarNotes) {
        setCalendarNotes(JSON.parse(storedCalendarNotes))
      }

      // Carregar produtos
      const storedProducts = localStorage.getItem("products")
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts))
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    }
  }, [])

  // Filtrar itens favoritos
  const favNotes = notes.filter((note) => favoriteNotes.includes(note.id))
  const favCalendarNotes = calendarNotes.filter((note) => favoriteCalendarNotes.includes(note.id))
  const favProducts = products.filter((product) => favoriteProducts.includes(product.id))

  // Filtrar por pesquisa
  const filteredNotes = favNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredCalendarNotes = favCalendarNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const filteredProducts = favProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Verificar se há algum favorito
  const hasFavorites = favNotes.length > 0 || favCalendarNotes.length > 0 || favProducts.length > 0

  // Contar total de favoritos
  const totalFavorites = favNotes.length + favCalendarNotes.length + favProducts.length

  // Contar total de favoritos filtrados
  const totalFilteredFavorites = filteredNotes.length + filteredCalendarNotes.length + filteredProducts.length

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Meus Favoritos</h1>
        <p className="text-muted-foreground">
          Gerencie todos os seus itens favoritos em um só lugar. Total: {totalFavorites} itens
        </p>
      </div>

      <div className="flex items-center mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar favoritos..."
          className="pl-10 pr-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {searchQuery && (
        <div className="mb-4 text-sm text-muted-foreground">
          Mostrando {totalFilteredFavorites} resultados para "{searchQuery}"
        </div>
      )}

      {!hasFavorites ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Nenhum item favorito</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Você ainda não marcou nenhum item como favorito. Navegue pelo aplicativo e clique no ícone de estrela para
              adicionar itens aos seus favoritos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>Todos ({totalFilteredFavorites})</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <Pen className="h-4 w-4" />
                <span>Anotações ({filteredNotes.length})</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Calendário ({filteredCalendarNotes.length})</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Produtos ({filteredProducts.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-4">
            {filteredNotes.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Pen className="h-5 w-5 mr-2" /> Anotações Favoritas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNotes.map((note) => (
                    <Card key={note.id} className={cn("overflow-hidden", note.color)}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{note.title}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => toggleNotesFavorite(note.id)}
                          >
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </Button>
                        </div>
                        <CardDescription>{note.date.split("(")[0]}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-3">{note.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {filteredCalendarNotes.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" /> Eventos Favoritos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCalendarNotes.map((note) => (
                    <Card key={note.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{note.title}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => toggleCalendarFavorite(note.id)}
                          >
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </Button>
                        </div>
                        <CardDescription>{note.date}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-3">{note.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {filteredProducts.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2" /> Produtos Favoritos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className={cn("overflow-hidden", product.color)}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => toggleProductsFavorite(product.id)}
                          >
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </Button>
                        </div>
                        <CardDescription>
                          {product.price
                            ? Number(product.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "Sem preço definido"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-3">{product.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes">
            {filteredNotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map((note) => (
                  <Card key={note.id} className={cn("overflow-hidden", note.color)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{note.title}</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => toggleNotesFavorite(note.id)}
                        >
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </Button>
                      </div>
                      <CardDescription>{note.date.split("(")[0]}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3">{note.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Pen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Nenhuma anotação favorita</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Você ainda não marcou nenhuma anotação como favorita ou sua pesquisa não retornou resultados.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar">
            {filteredCalendarNotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCalendarNotes.map((note) => (
                  <Card key={note.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{note.title}</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => toggleCalendarFavorite(note.id)}
                        >
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </Button>
                      </div>
                      <CardDescription>{note.date}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3">{note.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Nenhum evento favorito</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Você ainda não marcou nenhum evento como favorito ou sua pesquisa não retornou resultados.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="products">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className={cn("overflow-hidden", product.color)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => toggleProductsFavorite(product.id)}
                        >
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </Button>
                      </div>
                      <CardDescription>
                        {product.price
                          ? Number(product.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : "Sem preço definido"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3">{product.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Nenhum produto favorito</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Você ainda não marcou nenhum produto como favorito ou sua pesquisa não retornou resultados.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
