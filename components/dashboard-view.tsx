"use client"
import { Calendar, MessageSquare, Package, Plus, Pen, Star, ListTodo, Clock } from "lucide-react"
import type React from "react"

import { useEffect, useState, useCallback } from "react" // Adicionado useCallback

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"

// Importe o hook useLocalStorage e useFavorites
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useFavorites } from "@/hooks/use-favorites"
import { useNotification } from "@/components/notification-provider"

// Substitua a linha de importação do date-fns no topo do arquivo:
// import { format, isAfter, isBefore, addHours } from "date-fns"
// import { ptBR } = "date-fns/locale"

// Por estas importações individuais:
import format from "date-fns/format"
import isAfter from "date-fns/isAfter"
import isBefore from "date-fns/isBefore"
import addHours from "date-fns/addHours"
import { ptBR } from "date-fns/locale"

// Adicione a importação do `PomodoroWidget`
import PomodoroWidget from "@/components/widgets/pomodoro-widget"

interface DashboardProps {
  onViewChange: (view: string) => void
  userName?: string // Torne o nome do usuário opcional
}

// Tipos para os widgets da dashboard
interface Widget {
  id: string
  type:
    | "finance"
    | "notes"
    | "events"
    | "message"
    | "products"
    | "diary"
    | "mindmap"
    | "productivity"
    | "favorites"
    | "checklist"
    | "pomodoro" // Adicione esta linha
  title: string
  pinned: boolean
}

// Interface para transações financeiras
interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  description: string
  date: string
}

// Interface para notas
interface Note {
  id: string
  title: string
  content: string
  date: string
  color?: string
}

// Interface para entradas do diário
interface DiaryEntry {
  id: string
  content: string
  date: string
}

// Interface para entradas organizadas por dia da semana
interface WeeklyEntries {
  [key: string]: DiaryEntry[]
}

// Interface para metas semanais
interface WeeklyGoal {
  id: string
  title: string
  progress: number
  dailyChecks: {
    [day: string]: boolean
  }
}

// Interface para hábitos
interface Habit {
  id: string
  title: string
  completed: boolean
  streak: number
  lastCompleted?: string
}

// Interface para nós do mapa mental
interface MindMapNode {
  id: string
  title: string
  content: string
  position: { x: number; y: number }
  connections: string[]
  color: string
}

// Interface para produtos
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

// Interface para anotações do calendário
interface CalendarNote {
  id: string
  date: string
  title: string
  content: string
}

// Adicione esta interface após as outras interfaces no arquivo
interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

export default function DashboardView({ onViewChange, userName = "" }: DashboardProps) {
  const [widgets, setWidgets] = useLocalStorage<Widget[]>("dashboard-widgets", [])
  const [showWelcome, setShowWelcome] = useLocalStorage<boolean>("dashboard-show-welcome", true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [weeklyEntries, setWeeklyEntries] = useState<WeeklyEntries>({})
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [mindMapNodes, setMindMapNodes] = useState<MindMapNode[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([])
  const [motivationalQuote, setMotivationalQuote] = useState<string>("")
  const [biblicalQuote, setBiblicalQuote] = useState<string>("")
  const [dailyMessage, setDailyMessage] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  // NOVO ESTADO: Para controlar a abertura do diálogo de adicionar widget
  const [isAddWidgetDialogOpen, setIsAddWidgetDialogOpen] = useState(false)

  // Adicione este estado dentro da função DashboardView, junto com os outros estados
  const [checklistItems, setChecklistItems] = useLocalStorage<ChecklistItem[]>("dashboard-checklist", [])
  const [newChecklistItem, setNewChecklistItem] = useState("")

  // Hooks de favoritos
  const { favorites: favoriteNotes } = useFavorites<Note>({ storageKey: "notes" })
  const { favorites: favoriteCalendarNotes } = useFavorites<CalendarNote>({ storageKey: "calendar-notes" })
  const { favorites: favoriteProducts } = useFavorites<Product>({ storageKey: "products" })

  // Obter o contexto de notificações
  const notification = useNotification()

  // Adicione estas funções dentro da função DashboardView, antes do return
  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: `checklist-${Date.now()}`,
        text: newChecklistItem.trim(),
        completed: false,
        createdAt: Date.now(),
      }
      setChecklistItems([...checklistItems, newItem])
      setNewChecklistItem("")
    }
  }

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)))
  }

  const removeChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addChecklistItem()
    }
  }

  useEffect(() => {
    // Carregar dados do localStorage
    try {
      // Carregar transações
      const storedTransactions = localStorage.getItem("finance-transactions")
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions))
      }

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

      // Carregar entradas do diário
      const storedDiaryEntries = localStorage.getItem("diary-entries")
      if (storedDiaryEntries) {
        setWeeklyEntries(JSON.parse(storedDiaryEntries))
      }

      // Carregar metas semanais
      const storedWeeklyGoals = localStorage.getItem("productivity-weekly-goals")
      if (storedWeeklyGoals) {
        setWeeklyGoals(JSON.parse(storedWeeklyGoals))
      }

      // Carregar hábitos
      const storedHabits = localStorage.getItem("productivity-habits")
      if (storedHabits) {
        setHabits(JSON.parse(storedHabits))
      }

      // Carregar nós do mapa mental
      const storedMindMapNodes = localStorage.getItem("mind-map-nodes")
      if (storedMindMapNodes) {
        setMindMapNodes(JSON.parse(storedMindMapNodes))
      }

      // Carregar produtos
      const storedProducts = localStorage.getItem("products")
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts))
      }

      // Carregar mensagens do dia
      const storedMotivationalQuote = localStorage.getItem("daily-motivational-quote")
      if (storedMotivationalQuote) {
        setMotivationalQuote(JSON.parse(storedMotivationalQuote))
      }

      const storedBiblicalQuote = localStorage.getItem("daily-biblical-quote")
      if (storedBiblicalQuote) {
        setBiblicalQuote(JSON.parse(storedBiblicalQuote))
      }

      const storedDailyMessage = localStorage.getItem("daily-message")
      if (storedDailyMessage) {
        setDailyMessage(JSON.parse(storedDailyMessage))
      }

      // Verificar se as frases precisam ser atualizadas hoje
      const lastQuoteUpdate = localStorage.getItem("daily-quote-updated")
      if (lastQuoteUpdate) {
        const lastUpdate = new Date(JSON.parse(lastQuoteUpdate))
        const today = new Date()

        // Se a última atualização não foi hoje, atualizar as frases
        if (lastUpdate.toDateString() !== today.toDateString()) {
          updateDailyQuotes()
        }
      } else {
        // Se não houver registro de última atualização, atualizar as frases
        updateDailyQuotes()
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Escutar eventos de navegação de notificações
  useEffect(() => {
    const handleNavigateToView = (event: CustomEvent) => {
      if (event.detail && typeof (event.detail === "string")) {
        onViewChange(event.detail)
      }
    }

    window.addEventListener("navigate-to-view", handleNavigateToView as EventListener)

    return () => {
      window.removeEventListener("navigate-to-view", handleNavigateToView as EventListener)
    }
  }, [onViewChange])

  // Adicione esta função para atualizar as frases diariamente
  const updateDailyQuotes = () => {
    // Lista de frases motivacionais
    const MOTIVATIONAL_QUOTES = [
      "O sucesso não é final, o fracasso não é fatal: é a coragem de continuar que conta.",
      "A única maneira de fazer um excelente trabalho é amar o que você faz.",
      "Não importa o quão devagar você vá, desde que você não pare.",
      "Acredite que você pode, assim você já está no meio do caminho.",
      "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
      "Não tenha medo de desistir do bom para perseguir o ótimo.",
      "A persistência é o caminho do êxito.",
      "Você é mais forte do que pensa e será mais bem-sucedido do que imagina.",
      "Não espere por oportunidades, crie você mesmo as suas.",
      "Sua única limitação é aquela que você impõe em sua própria mente.",
      "O pessimista vê dificuldade em cada oportunidade. O otimista vê oportunidade em cada dificuldade.",
      "Não é sobre ter tempo, é sobre fazer tempo.",
      "Seja a mudança que você deseja ver no mundo.",
      "Quanto maior a dificuldade, maior a glória.",
      "Não conte os dias, faça os dias contarem.",
      "O que você faz hoje pode melhorar todos os seus amanhãs.",
      "Nunca é tarde demais para ser o que você poderia ter sido.",
      "Comece onde você está. Use o que você tem. Faça o que você pode.",
      "Quando você quer alguma coisa, todo o universo conspira para que você realize seu desejo.",
      "Você não é derrotado quando perde, você é derrotado quando desiste.",
    ]

    // Lista de frases bíblicas
    const BIBLICAL_QUOTES = [
      "Tudo posso naquele que me fortalece. (Filipenses 4:13)",
      "O Senhor é a minha força e o meu escudo; nele o meu coração confia, e dele recebo ajuda. (Salmos 28:7)",
      "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça. (Isaías 41:10)",
      "Mas os que esperam no Senhor renovarão as forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão. (Isaías 40:31)",
      "Porque Deus não nos deu espírito de covardia, mas de poder, de amor e de moderação. (2 Timóteo 1:7)",
      "Sejam fortes e corajosos. Não tenham medo nem fiquem apavorados por causa delas, pois o Senhor, o seu Deus, vai com vocês; nunca os deixará, nunca os abandonará. (Deuteronômio 31:6)",
      "O Senhor é o meu pastor, nada me faltará. (Salmos 23:1)",
      "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará. (Salmos 37:5)",
      "Porque eu bem sei os planos que tenho a vosso respeito, diz o Senhor; planos de paz, e não de mal, para vos dar um futuro e uma esperança. (Jeremias 29:11)",
      "Deleita-te também no Senhor, e ele te concederá os desejos do teu coração. (Salmos 37:4)",
      "Não se amoldem ao padrão deste mundo, mas transformem-se pela renovação da sua mente, para que sejam capazes de experimentar e comprovar a boa, agradável e perfeita vontade de Deus. (Romanos 12:2)",
      "Portanto, meus amados irmãos, sede firmes e constantes, sempre abundantes na obra do Senhor, sabendo que o vosso trabalho não é vão no Senhor. (1 Coríntios 15:58)",
      "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento. (Provérbios 3:5)",
      "Eu disse essas coisas para que em mim vocês tenham paz. Neste mundo vocês terão aflições; contudo, tenham ânimo! Eu venci o mundo. (João 16:33)",
      "Não fui eu que ordenei a você? Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar. (Josué 1:9)",
    ]

    // Função para selecionar uma frase aleatória
    const getRandomQuote = (quotes) => {
      const randomIndex = Math.floor(Math.random() * quotes.length)
      return quotes[randomIndex]
    }

    // Selecionar novas frases
    const newMotivationalQuote = getRandomQuote(MOTIVATIONAL_QUOTES)
    const newBiblicalQuote = getRandomQuote(BIBLICAL_QUOTES)

    // Atualizar o estado e o localStorage
    setMotivationalQuote(newMotivationalQuote)
    setBiblicalQuote(newBiblicalQuote)

    localStorage.setItem("daily-motivational-quote", JSON.stringify(newMotivationalQuote))
    localStorage.setItem("daily-biblical-quote", JSON.stringify(newBiblicalQuote))
    localStorage.setItem("daily-quote-updated", JSON.stringify(new Date().toLocaleString()))
  }

  // Calcular saldo, receitas e despesas com base nas transações reais
  const calculateBalance = () => {
    return transactions.reduce((total, transaction) => {
      return transaction.type === "income" ? total + transaction.amount : total - transaction.amount
    }, 0)
  }

  const calculateIncome = () => {
    return transactions.filter((t) => t.type === "income").reduce((total, t) => total + t.amount, 0)
  }

  const calculateExpenses = () => {
    return transactions.filter((t) => t.type === "expense").reduce((total, t) => total + t.amount, 0)
  }

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    // Formata o número com separadores de milhar e decimal
    const formattedNumber = value
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    return `R$ ${formattedNumber}`
  }

  // Obter eventos do calendário (simulado)
  const upcomingEvents = [
    { id: 1, title: "Reunião de equipe", date: "Hoje, 15:00" },
    { id: 2, title: "Entrega do projeto", date: "Amanhã, 10:00" },
    { id: 3, title: "Consulta médica", date: "26/04/2025, 14:30" },
  ]

  // Função para adicionar um widget à dashboard
  const addWidget = useCallback(
    (type: Widget["type"]) => {
      const newWidget: Widget = {
        id: `${type}-${Date.now()}`,
        type,
        title: getWidgetTitle(type),
        pinned: true,
      }

      setWidgets((prevWidgets) => [...prevWidgets, newWidget]) // Usando atualização de estado funcional
      setShowWelcome(false)
      setIsAddWidgetDialogOpen(false) // Fechar o diálogo após adicionar o widget
    },
    [setWidgets, setShowWelcome, setIsAddWidgetDialogOpen],
  ) // Dependências para useCallback

  // Função para remover um widget da dashboard
  const removeWidget = (id: string) => {
    setWidgets(widgets.filter((widget) => widget.id !== id))
    if (widgets.length <= 1) {
      setShowWelcome(true)
    }
  }

  // Função para obter o título do widget com base no tipo
  const getWidgetTitle = (type: Widget["type"]): string => {
    switch (type) {
      case "finance":
        return "Financeiro"
      case "notes":
        return "Anotações do Dia a Dia"
      case "events":
        return "Próximos Eventos"
      case "message":
        return "Mensagem do Dia"
      case "products":
        return "Criação de Produtos"
      case "diary":
        return "Diário Semanal"
      case "mindmap":
        return "Mapa Mental"
      case "productivity":
        return "Organização / Produtividade"
      case "favorites":
        return "Itens Favoritos"
      case "checklist":
        return "Checklist de Atualizações"
      case "pomodoro": // Adicione este caso
        return "Técnica Pomodoro"
      default:
        return "Widget"
    }
  }

  // Dentro da função DashboardView, adicione esta função para obter eventos próximos
  const getUpcomingEvents = () => {
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    // Filtrar eventos que acontecem hoje ou nas próximas 24 horas
    return calendarNotes
      .filter((event) => {
        const eventDate = new Date(event.date)
        return isAfter(eventDate, now) && isBefore(eventDate, addHours(now, 24))
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3) // Mostrar apenas os 3 próximos eventos
      .map((event) => ({
        ...event,
        formattedDate: format(new Date(event.date), "EEEE, HH:mm", { locale: ptBR }),
      }))
  }

  // Função para renderizar o conteúdo do widget com base no tipo
  const renderWidgetContent = (widget: Widget) => {
    switch (widget.type) {
      case "finance":
        return (
          <div>
            {/* Layout financeiro completamente redesenhado */}
            <div className="mb-4">
              <div className="border rounded-md overflow-hidden mb-2">
                <div className="bg-background/50 p-2 text-center">
                  <div className="text-sm font-medium">Saldo Total</div>
                </div>
                <div className={`p-3 text-center ${calculateBalance() >= 0 ? "text-green-500" : "text-red-500"}`}>
                  <div className="text-xl font-bold">{formatCurrency(calculateBalance())}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-background/50 p-2 text-center">
                    <div className="text-sm font-medium">Receitas</div>
                  </div>
                  <div className="p-3 text-center text-green-500">
                    <div className="text-lg font-bold">{formatCurrency(calculateIncome())}</div>
                  </div>
                </div>
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-background/50 p-2 text-center">
                    <div className="text-sm font-medium">Despesas</div>
                  </div>
                  <div className="p-3 text-center text-red-500">
                    <div className="text-lg font-bold">{formatCurrency(calculateExpenses())}</div>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => onViewChange("finances")}>
              Ver Detalhes Financeiros
            </Button>
          </div>
        )
      case "notes":
        return (
          <div className="space-y-4">
            {notes.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                Nenhuma anotação encontrada. Crie sua primeira anotação!
              </div>
            ) : (
              notes.slice(0, 2).map((note) => (
                <div key={note.id} className={`border rounded-lg p-3 ${note.color || ""}`}>
                  <div className="font-medium flex items-center">
                    {note.title}
                    {favoriteNotes.includes(note.id) && (
                      <Star className="h-3 w-3 ml-2 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.content}</div>
                  <div className="text-xs text-muted-foreground mt-2">{note.date.split("(")[0]}</div>
                </div>
              ))
            )}
            <Button variant="outline" className="w-full" onClick={() => onViewChange("notes")}>
              {notes.length === 0 ? "Criar Anotação" : "Ver Todas as Anotações"}
            </Button>
          </div>
        )
      case "events":
        const upcomingEvents = getUpcomingEvents()
        return (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground mb-1">Período de Visualização</div>
            {upcomingEvents.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">Nenhum evento próximo nas próximas 24 horas</div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full p-2 bg-primary/20">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.formattedDate}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <Button variant="outline" className="w-full" onClick={() => onViewChange("calendar")}>
              Ver Calendário Completo
            </Button>
          </div>
        )
      case "message":
        return (
          <div className="space-y-4">
            {!motivationalQuote && !biblicalQuote && !dailyMessage ? (
              <div className="text-center text-muted-foreground py-6">
                Nenhuma mensagem definida. Defina sua mensagem do dia!
              </div>
            ) : (
              <>
                {motivationalQuote && (
                  <div className="text-center italic p-4 bg-blue-500/10 rounded-md">"{motivationalQuote}"</div>
                )}
                {biblicalQuote && (
                  <div className="text-center italic p-4 bg-amber-500/10 rounded-md">"{biblicalQuote}"</div>
                )}
                {dailyMessage && (
                  <div className="text-center p-4 bg-primary/5 rounded-md">
                    <div className="font-medium mb-1">Sua Mensagem:</div>
                    <div className="italic">"{dailyMessage}"</div>
                  </div>
                )}
              </>
            )}
            {/* Botão redesenhado para centralizar perfeitamente o ícone e o texto */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 px-4 py-2"
                onClick={() => onViewChange("message")}
              >
                <MessageSquare className="h-4 w-4" />
                <span>
                  {!motivationalQuote && !biblicalQuote && !dailyMessage
                    ? "Definir Mensagem do Dia"
                    : "Atualizar Mensagem"}
                </span>
              </Button>
            </div>
          </div>
        )
      case "products":
        return (
          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                Nenhum produto encontrado. Crie seu primeiro produto!
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">Total de Produtos: {products.length}</div>
                </div>
                {products.slice(0, 2).map((product) => (
                  <div key={product.id} className={`border rounded-lg p-3 ${product.color || ""}`}>
                    <div className="font-medium flex items-center">
                      {product.name}
                      {favoriteProducts.includes(product.id) && (
                        <Star className="h-3 w-3 ml-2 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</div>
                    {product.price && (
                      <div className="text-sm font-semibold mt-1">
                        {Number(product.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
            <Button variant="outline" className="w-full" onClick={() => onViewChange("products")}>
              {products.length === 0 ? "Criar Produto" : "Gerenciar Produtos"}
            </Button>
          </div>
        )
      case "diary":
        // Verificar se há entradas no diário
        const hasEntries = Object.values(weeklyEntries).some((entries) => entries && entries.length > 0)
        // Obter o dia atual da semana
        const getCurrentDay = () => {
          const today = new Date().getDay() // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
          const diasDaSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
          // Converter de 0-6 (domingo-sábado) para nosso formato (segunda-domingo)
          return diasDaSemana[today === 0 ? 6 : today - 1]
        }
        const currentDay = getCurrentDay()

        return (
          <div className="space-y-4">
            {!hasEntries ? (
              <div className="text-center text-muted-foreground py-6">
                Nenhuma entrada no diário. Comece a registrar seus pensamentos!
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">Dia atual: {currentDay}</div>
                </div>
                {weeklyEntries[currentDay] && weeklyEntries[currentDay].length > 0 ? (
                  <div className="border rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">
                      {weeklyEntries[currentDay][0].date.split("(")[0]}
                    </div>
                    <div className="text-sm line-clamp-3">{weeklyEntries[currentDay][0].content}</div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-2">Nenhuma entrada para {currentDay}</div>
                )}
              </>
            )}
            <Button variant="outline" className="w-full" onClick={() => onViewChange("diary")}>
              {!hasEntries ? "Criar Entrada no Diário" : "Ver Diário Completo"}
            </Button>
          </div>
        )
      case "mindmap":
        return (
          <div className="space-y-4">
            {mindMapNodes.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                Nenhum mapa mental encontrado. Crie seu primeiro mapa!
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">Total de Nós: {mindMapNodes.length}</div>
                </div>
                <div className="border rounded-lg p-3 bg-muted/20">
                  <div className="text-center">
                    <div className="font-medium mb-1">Mapa Mental</div>
                    <div className="text-sm text-muted-foreground">
                      {mindMapNodes.length} nós e {mindMapNodes.reduce((acc, node) => acc + node.connections.length, 0)}{" "}
                      conexões
                    </div>
                  </div>
                </div>
              </>
            )}
            <Button variant="outline" className="w-full" onClick={() => onViewChange("mindmap")}>
              {mindMapNodes.length === 0 ? "Criar Mapa Mental" : "Ver Mapa Mental"}
            </Button>
          </div>
        )
      case "productivity":
        return (
          <div className="space-y-4">
            {weeklyGoals.length === 0 && habits.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                Nenhuma meta ou hábito encontrado. Comece a organizar sua produtividade!
              </div>
            ) : (
              <>
                {weeklyGoals.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Metas da Semana</div>
                    {weeklyGoals.slice(0, 2).map((goal) => (
                      <div key={goal.id} className="mb-3">
                        <div className="flex justify-between text-sm">
                          <span>{goal.title}</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2 mt-1" />
                      </div>
                    ))}
                  </div>
                )}
                {habits.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Hábitos</div>
                    {habits.slice(0, 2).map((habit) => (
                      <div key={habit.id} className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 rounded-full mr-2 ${
                              habit.completed ? "bg-green-500" : "border border-muted-foreground"
                            }`}
                          ></div>
                          <span className={`text-sm ${habit.completed ? "line-through text-muted-foreground" : ""}`}>
                            {habit.title}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">Sequência: {habit.streak}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <Button variant="outline" className="w-full" onClick={() => onViewChange("productivity")}>
              {weeklyGoals.length === 0 && habits.length === 0
                ? "Configurar Produtividade"
                : "Ver Organização Completa"}
            </Button>
          </div>
        )
      case "favorites":
        // Coletar todos os itens favoritos
        const favNotes = notes.filter((note) => favoriteNotes.includes(note.id))
        const favCalendarNotes = calendarNotes.filter((note) => favoriteCalendarNotes.includes(note.id))
        const favProducts = products.filter((product) => favoriteProducts.includes(product.id))

        // Verificar se há algum favorito
        const hasFavorites = favNotes.length > 0 || favCalendarNotes.length > 0 || favProducts.length > 0

        return (
          <div className="space-y-4">
            {!hasFavorites ? (
              <div className="text-center text-muted-foreground py-6">
                Nenhum item favorito encontrado. Marque itens como favoritos para vê-los aqui!
              </div>
            ) : (
              <>
                {favNotes.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center">
                      <Pen className="h-3 w-3 mr-1" /> Anotações Favoritas
                    </div>
                    {favNotes.slice(0, 2).map((note) => (
                      <div key={note.id} className={`border rounded-lg p-3 mb-2 ${note.color || ""}`}>
                        <div className="font-medium flex items-center">
                          {note.title}
                          <Star className="h-3 w-3 ml-2 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.content}</div>
                      </div>
                    ))}
                    {favNotes.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">+{favNotes.length - 2} mais</div>
                    )}
                  </div>
                )}

                {favCalendarNotes.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" /> Calendário Favoritos
                    </div>
                    {favCalendarNotes.slice(0, 2).map((note) => (
                      <div key={note.id} className="border rounded-lg p-3 mb-2">
                        <div className="font-medium flex items-center">
                          {note.title}
                          <Star className="h-3 w-3 ml-2 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="text-xs text-muted-foreground">{note.date}</div>
                      </div>
                    ))}
                    {favCalendarNotes.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{favCalendarNotes.length - 2} mais
                      </div>
                    )}
                  </div>
                )}

                {favProducts.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center">
                      <Package className="h-3 w-3 mr-1" /> Produtos Favoritos
                    </div>
                    {favProducts.slice(0, 2).map((product) => (
                      <div key={product.id} className={`border rounded-lg p-3 mb-2 ${product.color || ""}`}>
                        <div className="font-medium flex items-center">
                          {product.name}
                          <Star className="h-3 w-3 ml-2 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-1">{product.description}</div>
                      </div>
                    ))}
                    {favProducts.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">+{favProducts.length - 2} mais</div>
                    )}
                  </div>
                )}
              </>
            )}
            <Button variant="outline" className="w-full" onClick={() => onViewChange("notes")}>
              Gerenciar Favoritos
            </Button>
          </div>
        )
      case "checklist":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Adicionar nova tarefa..."
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <Button onClick={addChecklistItem} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {checklistItems.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                Nenhuma tarefa adicionada. Adicione tarefas para acompanhar suas atualizações.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={item.completed}
                        onCheckedChange={() => toggleChecklistItem(item.id)}
                      />
                      <label
                        htmlFor={item.id}
                        className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}
                      >
                        {item.text}
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeChecklistItem(item.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-x"
                      >
                        <path d="M18 6 6 18"></path>
                        <path d="m6 6 12 12"></path>
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {checklistItems.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {checklistItems.filter((item) => item.completed).length} de {checklistItems.length} tarefas concluídas
              </div>
            )}
          </div>
        )
      case "pomodoro": // Adicione este caso
        return <PomodoroWidget />
      default:
        return <div>Conteúdo não disponível</div>
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {userName ? `Olá, ${userName}` : "Dashboard"}
          </h2>
        </div>
        <Dialog open={isAddWidgetDialogOpen} onOpenChange={setIsAddWidgetDialogOpen}>
          {" "}
          {/* Usando o novo estado */}
          <DialogTrigger asChild>
            {/* Adicionado onClick explícito para garantir que o diálogo abra */}
            <Button
              // Removendo variant="default" e adicionando classes diretas para garantir o estilo
              className="bg-black text-white rounded-md px-3 py-1.5 text-sm hover:bg-black/90"
              onClick={() => setIsAddWidgetDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Adicionar Widget</span>
              <span className="sm:hidden">Widget</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Widget</DialogTitle>
              <DialogDescription>Escolha um widget para adicionar à sua dashboard.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <Button
                variant="outline"
                className="h-20 sm:h-24 flex flex-col items-center justify-center"
                onClick={() => addWidget("message")}
              >
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                <span>Mensagem do Dia</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 sm:h-24 flex flex-col items-center justify-center"
                onClick={() => addWidget("productivity")}
              >
                <ListTodo className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                <span>Organização / Produtividade</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 sm:h-24 flex flex-col items-center justify-center"
                onClick={() => addWidget("notes")}
              >
                <Pen className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                <span>Anotações do Dia a Dia</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 sm:h-24 flex flex-col items-center justify-center"
                onClick={() => addWidget("pomodoro")} // Adicione este botão
              >
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                <span>Pomodoro</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {showWelcome && widgets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-black p-6 mb-4">
              <Plus className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-medium mb-2">Sua Dashboard está vazia</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Adicione widgets para personalizar sua dashboard e visualizar as informações mais importantes para você.
            </p>
            <Dialog open={isAddWidgetDialogOpen} onOpenChange={setIsAddWidgetDialogOpen}>
              {" "}
              {/* Usando o novo estado */}
              <DialogTrigger asChild>
                {/* Adicionado onClick explícito para garantir que o diálogo abra */}
                <Button
                  // Removendo variant="default" e adicionando classes diretas para garantir o estilo
                  className="bg-black text-white rounded-md px-3 py-1.5 text-sm hover:bg-black/90"
                  onClick={() => setIsAddWidgetDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeiro Widget
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Widget</DialogTitle>
                  <DialogDescription>Escolha um widget para adicionar à sua dashboard.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center"
                    onClick={() => addWidget("message")}
                  >
                    <MessageSquare className="h-8 w-8 mb-2" />
                    <span>Mensagem do Dia</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center"
                    onClick={() => addWidget("productivity")}
                  >
                    <ListTodo className="h-8 w-8 mb-2" />
                    <span>Organização / Produtividade</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center"
                    onClick={() => addWidget("notes")}
                  >
                    <Pen className="h-8 w-8 mb-2" />
                    <span>Anotações do Dia a Dia</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center"
                    onClick={() => addWidget("pomodoro")} // Adicione este botão
                  >
                    <Clock className="h-8 w-8 mb-2" />
                    <span>Pomodoro</span>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {widgets.map((widget) => (
            <Card key={widget.id} className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>{widget.title}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => removeWidget(widget.id)}>Remover Widget</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>{renderWidgetContent(widget)}</CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
