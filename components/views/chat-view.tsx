"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  PenLine,
  Copy,
  Trash2,
  FileText,
  Send,
  Bot,
  PlusCircle,
  Loader2,
  Mic,
  History,
  MessagesSquare,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type ChatMessage = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

type SavedConversation = {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

const promptSuggestions = [
  "Crie um anúncio persuasivo para meu produto",
  "Como melhorar meu email marketing?",
  "Ideias para posts no Instagram sobre meu serviço",
  "Escreva um título chamativo para minha landing page",
  "Ajude-me a criar um slogan memorável",
  "Como estruturar uma descrição de produto que converte?",
]

export default function ChatView() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState<string>("")
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false)
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversationTitle, setConversationTitle] = useState<string>("")

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedMessageContent, setEditedMessageContent] = useState<string>("")

  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(false)
  const recognitionRef = useRef<any | null>(null)
  const isRecordingRef = useRef<boolean>(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // ====== Reconhecimento de voz ======
  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSpeechSupported(false)
      return
    }

    setIsSpeechSupported(true)

    const recognition = new SpeechRecognition()
    recognition.lang = "pt-BR"
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      try {
        const result = event.results[event.resultIndex]
        if (!result || !result[0]) return

        const transcript = result[0].transcript
        setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript))
      } catch (err) {
        console.error("Erro ao processar resultado de voz:", err)
      }
    }

    recognition.onerror = (event: any) => {
      console.error("Erro no reconhecimento de voz:", event)
      isRecordingRef.current = false
      setIsRecording(false)
      toast({
        title: "Erro no microfone",
        description: "Não foi possível capturar o áudio. Verifique as permissões do navegador.",
        variant: "destructive",
      })
    }

    recognition.onend = () => {
      if (isRecordingRef.current) {
        try {
          recognition.start()
        } catch (err) {
          console.error("Erro ao reiniciar reconhecimento de voz:", err)
          isRecordingRef.current = false
          setIsRecording(false)
        }
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop?.()
    }
  }, [toast])

  const toggleRecording = () => {
    if (!isSpeechSupported || !recognitionRef.current) {
      toast({
        title: "Microfone não disponível",
        description: "Seu navegador não suporta reconhecimento de voz ou o recurso está desativado.",
        variant: "destructive",
      })
      return
    }

    if (isRecordingRef.current) {
      isRecordingRef.current = false
      setIsRecording(false)
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error("Erro ao parar gravação:", error)
      }
      return
    }

    try {
      isRecordingRef.current = true
      setIsRecording(true)
      recognitionRef.current.start()
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error)
      isRecordingRef.current = false
      setIsRecording(false)
    }
  }

  // ====== LocalStorage ======
  useEffect(() => {
    const saved = localStorage.getItem("copywritingConversations")
    if (saved) {
      try {
        const parsed: SavedConversation[] = JSON.parse(saved)
        const withDates = parsed.map((c) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          messages: c.messages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }))
        setSavedConversations(withDates)
      } catch (e) {
        console.error("Erro ao carregar conversas:", e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("copywritingConversations", JSON.stringify(savedConversations))
  }, [savedConversations])

  // Scroll automático
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  // ====== Enviar mensagem normal ======
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    const updatedMessages = [...chatMessages, userMessage]
    setChatMessages(updatedMessages)
    setInputMessage("")
    setIsSendingMessage(true)

    let assistantMessage: ChatMessage | null = null

    try {
      const recentMessages = updatedMessages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify({ messages: recentMessages }),
      })

      const data = await response.json().catch(() => ({} as any))

      if (!response.ok || !data || typeof data.message !== "string") {
        throw new Error(data?.error || "Resposta inválida da IA")
      }

      assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setChatMessages(finalMessages)

      const baseTitle =
        conversationTitle ||
        `Conversa sobre ${userMessage.content.substring(0, 30)}${
          userMessage.content.length > 30 ? "..." : ""
        }`
      if (!conversationTitle) {
        setConversationTitle(baseTitle)
      }

      const now = new Date()

      if (currentConversationId) {
        setSavedConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? {
                  ...conv,
                  messages: finalMessages,
                  title: baseTitle || conv.title,
                  updatedAt: now,
                }
              : conv,
          ),
        )
      } else {
        const newId = now.getTime().toString()
        const newConversation: SavedConversation = {
          id: newId,
          title: baseTitle,
          messages: finalMessages,
          createdAt: now,
          updatedAt: now,
        }

        setCurrentConversationId(newId)
        setSavedConversations((prev) => [newConversation, ...prev])
      }
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error)
      toast({
        title: "Erro",
        description: `Não foi possível enviar a mensagem: ${error.message}`,
        variant: "destructive",
      })

      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content:
          "Desculpe, não consegui processar sua mensagem agora. Tente novamente em alguns segundos.",
        timestamp: new Date(),
      }

      const finalMessages = [...updatedMessages, errorMessage]
      setChatMessages(finalMessages)

      if (currentConversationId) {
        const now = new Date()
        setSavedConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? {
                  ...conv,
                  messages: finalMessages,
                  title: conversationTitle || conv.title,
                  updatedAt: now,
                }
              : conv,
          ),
        )
      }
    } finally {
      setIsSendingMessage(false)
    }
  }, [chatMessages, inputMessage, currentConversationId, conversationTitle, toast])

  // ====== Novo chat (cria novo card só aqui) ======
  const startNewConversation = () => {
    if (chatMessages.length > 0 && currentConversationId) {
      const now = new Date()
      setSavedConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? {
                ...conv,
                messages: chatMessages,
                title:
                  conversationTitle ||
                  conv.title ||
                  `Conversa ${savedConversations.length + 1}`,
                updatedAt: now,
              }
            : conv,
        ),
      )
    }

    setChatMessages([])
    setCurrentConversationId(null)
    setConversationTitle("")
    setEditingMessageId(null)
    setEditedMessageContent("")
    setInputMessage("")
  }

  const loadConversation = (id: string) => {
    const conversation = savedConversations.find((conv) => conv.id === id)
    if (conversation) {
      setChatMessages(conversation.messages)
      setCurrentConversationId(conversation.id)
      setConversationTitle(conversation.title)
      setEditingMessageId(null)
      setEditedMessageContent("")
      setInputMessage("")
    }
  }

  const deleteConversation = (id: string) => {
    setSavedConversations((prev) => prev.filter((conv) => conv.id !== id))

    if (currentConversationId === id) {
      setChatMessages([])
      setCurrentConversationId(null)
      setConversationTitle("")
      setEditingMessageId(null)
      setEditedMessageContent("")
    }

    toast({
      title: "Excluído",
      description: "Conversa removida com sucesso",
    })
  }

  const startEditingMessage = useCallback((message: ChatMessage) => {
    setEditingMessageId(message.id)
    setEditedMessageContent(message.content)
  }, [])

  // ====== Editar mensagem do usuário e regenerar resposta ======
  const saveEditedMessage = useCallback(
    async () => {
      if (!editingMessageId) return

      // 1) Encontra a mensagem que está sendo editada
      const msgIndex = chatMessages.findIndex((m) => m.id === editingMessageId)
      if (msgIndex === -1) return

      // 2) Atualiza o conteúdo da mensagem do usuário
      let messagesAfterEdit = chatMessages.map((msg, index) =>
        index === msgIndex ? { ...msg, content: editedMessageContent } : msg,
      )

      // 3) Remove a resposta antiga da IA logo depois, se existir
      if (messagesAfterEdit[msgIndex + 1]?.role === "assistant") {
        messagesAfterEdit = [
          ...messagesAfterEdit.slice(0, msgIndex + 1),
          ...messagesAfterEdit.slice(msgIndex + 2),
        ]
      }

      // Atualiza visualmente
      setChatMessages(messagesAfterEdit)
      setEditingMessageId(null)
      setEditedMessageContent("")
      setIsSendingMessage(true)

      try {
        // 4) Reenvia o contexto para a IA com a mensagem editada
        const recentMessages = messagesAfterEdit.slice(-10).map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          body: JSON.stringify({ messages: recentMessages }),
        })

        const data = await response.json().catch(() => ({} as any))

        if (!response.ok || !data || typeof data.message !== "string") {
          throw new Error(data?.error || "Resposta inválida da IA")
        }

        // 5) Cria nova resposta da IA
        const newAssistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        }

        const finalMessages = [...messagesAfterEdit, newAssistantMessage]
        setChatMessages(finalMessages)

        // 6) Atualiza histórico
        if (currentConversationId) {
          const now = new Date()
          setSavedConversations((prev) =>
            prev.map((conv) =>
              conv.id === currentConversationId
                ? {
                    ...conv,
                    messages: finalMessages,
                    title: conversationTitle || conv.title,
                    updatedAt: now,
                  }
                : conv,
            ),
          )
        }

        toast({
          title: "Copy atualizada",
          description: "Mensagem editada e nova resposta gerada pela IA.",
        })
      } catch (error: any) {
        console.error("Erro ao regenerar resposta:", error)
        toast({
          title: "Erro",
          description: "Não foi possível gerar uma nova resposta. Tente novamente.",
          variant: "destructive",
        })
      } finally {
        setIsSendingMessage(false)
      }
    },
    [
      chatMessages,
      editingMessageId,
      editedMessageContent,
      currentConversationId,
      conversationTitle,
      toast,
    ],
  )

  const cancelEditing = () => {
    setEditingMessageId(null)
    setEditedMessageContent("")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    })
  }

  // ====== JSX ======
  return (
    <div
      className="
        grid grid-cols-1 md:grid-cols-3 gap-6
        h-[calc(100vh-160px)] max-h-[calc(100vh-160px)]
        overflow-hidden
      "
    >
      {/* Sidebar com histórico */}
      <Card className="md:col-span-1 h-full flex flex-col overflow-hidden bg-zinc-950/70 border border-white/5 backdrop-blur-xl rounded-2xl shadow-lg">
        <CardHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
              <History className="h-4 w-4 text-zinc-200" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold tracking-wide">Histórico</CardTitle>
              <p className="text-xs text-zinc-500">Seus chats recentes com a IA</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-4 pt-0 flex-1 flex flex-col overflow-hidden">
          <div className="mb-2">
            <Button
              variant="outline"
              className="w-full justify-center text-xs rounded-full border-white/10 bg-white/5 hover:bg-white/10 transition-colors h-8"
              onClick={startNewConversation}
            >
              <PlusCircle className="mr-1 h-4 w-4" />
              Novo chat
            </Button>
          </div>

          <ScrollArea className="flex-1 pr-1">
            <div className="space-y-1.5">
              {savedConversations.length > 0 ? (
                savedConversations.map((conv) => {
                  const isActive = currentConversationId === conv.id
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => loadConversation(conv.id)}
                      className={`
                        w-full flex items-center justify-between gap-2 px-2.5 py-1.5
                        rounded-lg text-left transition-all border
                        ${
                          isActive
                            ? "bg-white/10 border-primary/40 shadow-inner"
                            : "bg-white/0 border-white/5 hover:bg-white/5"
                        }
                      `}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[11px] leading-tight truncate">
                          {conv.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-zinc-500">
                          {conv.updatedAt.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteConversation(conv.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </button>
                  )
                })
              ) : (
                <div className="text-center py-10 text-zinc-600 text-xs">
                  <p>Nenhuma conversa salva ainda.</p>
                  <p>Clique em &quot;Novo chat&quot; para começar.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat principal */}
      <Card className="md:col-span-2 h-full flex flex-col overflow-hidden bg-zinc-950/70 border border-white/5 backdrop-blur-xl rounded-2xl shadow-lg">
        <CardHeader className="px-5 pt-4 pb-3 border-b border-white/5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/40">
              <MessagesSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold tracking-wide">
                {currentConversationId ? conversationTitle || "Conversa" : "Conversa"}
              </CardTitle>
              <CardDescription className="text-xs">
                Converse com a IA para criar e melhorar seus textos de copywriting
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 px-5 py-4">
            {chatMessages.length > 0 ? (
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-3 ${
                        message.role === "user" ? "flex-row-reverse" : ""
                      } max-w-[70%]`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0 border border-white/10 bg-zinc-900">
                        {message.role === "user" ? (
                          <>
                            <AvatarFallback className="text-[10px]">VC</AvatarFallback>
                            <AvatarImage src="/vibrant-street-market.png" />
                          </>
                        ) : (
                          <>
                            <AvatarFallback className="text-[10px]">AI</AvatarFallback>
                            <AvatarImage src="/futuristic-helper-bot.png" />
                          </>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        {editingMessageId === message.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editedMessageContent}
                              onChange={(e) => setEditedMessageContent(e.target.value)}
                              className="min-h-[100px] w-full text-sm bg-zinc-900/80 border border-white/10 rounded-xl"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="text-xs h-8 px-3"
                                onClick={saveEditedMessage}
                                disabled={isSendingMessage || !editedMessageContent.trim()}
                              >
                                {isSendingMessage ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Enviar"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8 px-3"
                                onClick={cancelEditing}
                                disabled={isSendingMessage}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`
                              rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm
                              ${
                                message.role === "user"
                                  ? "bg-primary/90 text-primary-foreground border border-primary/50"
                                  : "bg-zinc-900/80 text-zinc-100 border border-white/10"
                              }
                            `}
                            style={{
                              overflowWrap: "break-word",
                              wordWrap: "break-word",
                              wordBreak: "break-word",
                              hyphens: "auto",
                              whiteSpace: "pre-wrap",
                              maxWidth: "100%",
                            }}
                          >
                            <p className="max-w-full">{message.content}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[11px] text-zinc-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>

                          <div className="flex flex-wrap gap-1">
                            {message.role === "assistant" && !editingMessageId && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] text-zinc-400 hover:text-zinc-100"
                                  onClick={() => copyToClipboard(message.content)}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copiar
                                </Button>
                                <UseTextButton text={message.content} />
                              </>
                            )}
                            {message.role === "user" &&
                              editingMessageId !== message.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] text-zinc-400 hover:text-zinc-100"
                                  onClick={() => startEditingMessage(message)}
                                >
                                  <PenLine className="h-3 w-3 mr-1" />
                                  Editar
                                </Button>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/40 flex items-center justify-center mb-3">
                  <Bot className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-base font-medium mb-1">Assistente de Copywriting</h3>
                <p className="text-xs text-zinc-400 mb-4 max-w-md">
                  Use a IA para criar anúncios, headlines, emails, scripts de vídeo e qualquer texto persuasivo que
                  você precisar.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-md">
                  {promptSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left h-auto py-2 text-xs rounded-xl border-white/10 bg-white/0 hover:bg-white/5"
                      onClick={() => setInputMessage(suggestion)}
                    >
                      <span className="truncate">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Área de input padrão */}
          <div className="px-5 pb-3 pt-3 border-t border-white/5 bg-zinc-950/80">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage()
              }}
              className="flex items-center gap-3"
            >
              <div className="flex-1 rounded-2xl bg-zinc-900/80 border border-white/10 px-3 py-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Digite sua mensagem ou use o microfone..."
                  className="min-h-[40px] max-h-[120px] w-full resize-none border-0 bg-transparent px-0 py-1 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={toggleRecording}
                  className={`
                    h-9 w-9 flex items-center justify-center rounded-full
                    border ${
                      isRecording
                        ? "border-emerald-500/70 bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                        : "border-white/10 bg-zinc-900/80 hover:bg-zinc-800"
                    }
                  `}
                  title={isRecording ? "Parar gravação" : "Falar por áudio"}
                >
                  <Mic className={`h-4 w-4 ${isRecording ? "text-emerald-400" : ""}`} />
                </Button>

                <Button
                  type="submit"
                  disabled={isSendingMessage || !inputMessage.trim()}
                  className="h-9 w-9 flex items-center justify-center rounded-full shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                >
                  {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function UseTextButton({ text }: { text: string }) {
  const { toast } = useToast()
  const useTextFromChat = useCallback(
    (t: string) => {
      toast({
        title: "Texto transferido",
        description: "O texto foi transferido para o editor",
      })
      // aqui depois você conecta com o editor de copy
    },
    [toast],
  )
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-[11px] text-zinc-400 hover:text-zinc-100"
      onClick={() => useTextFromChat(text)}
    >
      <FileText className="h-3 w-3 mr-1" />
      Usar no Editor
    </Button>
  )
}
