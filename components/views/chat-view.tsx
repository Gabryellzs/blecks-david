"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { PenLine, Copy, Trash2, FileText, Send, Bot, PlusCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Tipo para mensagens de chat
type ChatMessage = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

// Tipo para conversas salvas
type SavedConversation = {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

// Sugestões de prompts para o chat
const promptSuggestions = [
  "Crie um anúncio persuasivo para meu produto",
  "Como melhorar meu email marketing?",
  "Ideias para posts no Instagram sobre meu serviço",
  "Escreva um título chamativo para minha landing page",
  "Ajude-me a criar um slogan memorável",
  "Como estruturar uma descrição de produto que converte?",
]

export default function ChatView() {
  // Estados para o chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState<string>("")
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false)
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversationTitle, setConversationTitle] = useState<string>("")
  const [isCreatingNewChat, setIsCreatingNewChat] = useState<boolean>(false)

  // Estados para edição de mensagens
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedMessageContent, setEditedMessageContent] = useState<string>("")

  const chatEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Função para salvar a conversa atual
  const saveCurrentConversation = useCallback(
    (messages: ChatMessage[] = chatMessages) => {
      if (messages.length === 0) return

      const now = new Date()

      if (currentConversationId) {
        // Atualizar conversa existente
        setSavedConversations((prev) =>
          prev.map((conv) => {
            return conv.id === currentConversationId
              ? {
                  ...conv,
                  messages,
                  title: conversationTitle || conv.title,
                  updatedAt: now,
                }
              : conv
          }),
        )
      } else {
        // Criar nova conversa
        const newConversation: SavedConversation = {
          id: Date.now().toString(),
          title: conversationTitle || `Conversa ${savedConversations.length + 1}`,
          messages,
          createdAt: now,
          updatedAt: now,
        }

        setSavedConversations((prev) => [newConversation, ...prev])
        setCurrentConversationId(newConversation.id)
      }
    },
    [chatMessages, conversationTitle, currentConversationId, savedConversations],
  )

  // Carregar conversas do localStorage ao iniciar
  useEffect(() => {
    const savedConversations = localStorage.getItem("copywritingConversations")
    if (savedConversations) {
      try {
        setSavedConversations(JSON.parse(savedConversations))
      } catch (e) {
        console.error("Erro ao carregar conversas:", e)
      }
    }
  }, [])

  // Salvar conversas no localStorage quando mudar
  useEffect(() => {
    if (savedConversations.length > 0) {
      localStorage.setItem("copywritingConversations", JSON.stringify(savedConversations))
    }
  }, [savedConversations])

  // Rolar para o final do chat quando novas mensagens são adicionadas
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  // Função para enviar mensagem no chat
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return

    // Criar nova mensagem do usuário
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    // Adicionar mensagem do usuário ao chat
    const updatedMessages = [...chatMessages, userMessage]
    setChatMessages(updatedMessages)
    setInputMessage("")
    setIsSendingMessage(true)

    let assistantMessage: ChatMessage | null = null

    try {
      // Preparar mensagens para a API (apenas as últimas 10 para evitar tokens excessivos)
      const recentMessages = updatedMessages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Chamar a API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify({
          messages: recentMessages,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Adicionar resposta do assistente
      assistantMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      }

      setChatMessages([...updatedMessages, assistantMessage])

      // Se for uma nova conversa, criar um título automático
      if (currentConversationId === null && !conversationTitle) {
        setConversationTitle(`Conversa sobre ${inputMessage.substring(0, 20)}${inputMessage.length > 20 ? "..." : ""}`)
      }
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error)
      toast({
        title: "Erro",
        description: `Não foi possível enviar a mensagem: ${error.message}`,
        variant: "destructive",
      })

      // Adicionar mensagem de erro como resposta do assistente
      assistantMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Desculpe, não consegui processar sua mensagem. Por favor, tente novamente mais tarde.",
        timestamp: new Date(),
      }

      setChatMessages([...updatedMessages, assistantMessage])
    } finally {
      setIsSendingMessage(false)
      if (assistantMessage) {
        saveCurrentConversation([...updatedMessages, assistantMessage])
      } else {
        saveCurrentConversation(updatedMessages)
      }
    }
  }, [chatMessages, inputMessage, currentConversationId, conversationTitle, saveCurrentConversation, toast])

  // Função para iniciar uma nova conversa
  const startNewConversation = () => {
    setChatMessages([])
    setCurrentConversationId(null)
    setConversationTitle("")
    setIsCreatingNewChat(false)
  }

  // Função para carregar uma conversa salva
  const loadConversation = (id: string) => {
    const conversation = savedConversations.find((conv) => conv.id === id)
    if (conversation) {
      setChatMessages(conversation.messages)
      setCurrentConversationId(conversation.id)
      setConversationTitle(conversation.title)
    }
  }

  // Função para excluir uma conversa
  const deleteConversation = (id: string) => {
    setSavedConversations((prev) => prev.filter((conv) => conv.id !== id))

    if (currentConversationId === id) {
      startNewConversation()
    }

    toast({
      title: "Excluído",
      description: "Conversa removida com sucesso",
    })
  }

  // Função para iniciar a edição de uma mensagem
  const startEditingMessage = useCallback((message: ChatMessage) => {
    setEditingMessageId(message.id)
    setEditedMessageContent(message.content)
  }, [])

  // Função para salvar a mensagem editada
  const saveEditedMessage = useCallback(() => {
    if (!editingMessageId) return

    const updatedMessages = chatMessages.map((msg) =>
      msg.id === editingMessageId ? { ...msg, content: editedMessageContent } : msg,
    )

    setChatMessages(updatedMessages)
    saveCurrentConversation(updatedMessages)

    // Resetar o estado de edição
    setEditingMessageId(null)
    setEditedMessageContent("")

    toast({
      title: "Mensagem atualizada",
      description: "Sua mensagem foi editada com sucesso",
    })
  }, [chatMessages, editingMessageId, editedMessageContent, saveCurrentConversation, toast])

  // Função para cancelar a edição
  const cancelEditing = () => {
    setEditingMessageId(null)
    setEditedMessageContent("")
  }

  // Função para copiar o texto
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    })
  }

  // Função para usar texto do chat no gerador de copy
  const useTextFromChat = useCallback(
    (text: string) => {
      // Aqui você pode implementar a lógica para transferir o texto para o editor
      toast({
        title: "Texto transferido",
        description: "O texto foi transferido para o editor",
      })
    },
    [toast],
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      {/* Sidebar com conversas salvas */}
      <Card className="md:col-span-1 h-full flex flex-col">
        <CardHeader className="p-4">
          <CardTitle className="text-lg">Conversas</CardTitle>
        </CardHeader>
        <CardContent className="p-2 flex-1 overflow-hidden">
          <div className="mb-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => setIsCreatingNewChat(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Conversa
            </Button>
          </div>

          {isCreatingNewChat && (
            <div className="mb-2 p-2 border rounded-md">
              <Input
                placeholder="Nome da conversa"
                value={conversationTitle}
                onChange={(e) => setConversationTitle(e.target.value)}
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={startNewConversation}>
                  Criar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsCreatingNewChat(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="h-[calc(100%-40px)]">
            <div className="space-y-2 pr-2">
              {savedConversations.length > 0 ? (
                savedConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-2 rounded-md cursor-pointer flex items-center ${
                      currentConversationId === conv.id ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  >
                    {/* Área clicável para carregar a conversa */}
                    <div className="flex-1 min-w-0 mr-2" onClick={() => loadConversation(conv.id)}>
                      <p className="font-medium truncate text-sm" style={{ maxWidth: "100%" }}>
                        {conv.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.updatedAt).toLocaleDateString().split("/")[0]}/
                        {new Date(conv.updatedAt).toLocaleDateString().split("/")[1]}
                      </p>
                    </div>

                    {/* Botão de excluir separado da área clicável */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 w-8 h-8 p-0"
                      onClick={() => deleteConversation(conv.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma conversa salva</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat principal */}
      <Card className="md:col-span-2 h-full flex flex-col">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg">
            {currentConversationId ? conversationTitle || "Conversa" : "Nova Conversa"}
          </CardTitle>
          <CardDescription>Converse com a IA para criar e melhorar seus textos de copywriting</CardDescription>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col">
          {/* Área de mensagens */}
          <ScrollArea className="flex-1 p-4">
            {chatMessages.length > 0 ? (
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                      style={{ maxWidth: "60%" }}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {message.role === "user" ? (
                          <>
                            <AvatarFallback>U</AvatarFallback>
                            <AvatarImage src="/vibrant-street-market.png" />
                          </>
                        ) : (
                          <>
                            <AvatarFallback>AI</AvatarFallback>
                            <AvatarImage src="/futuristic-helper-bot.png" />
                          </>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        {editingMessageId === message.id ? (
                          // Modo de edição
                          <div className="space-y-2">
                            <Textarea
                              value={editedMessageContent}
                              onChange={(e) => setEditedMessageContent(e.target.value)}
                              className="min-h-[100px] w-full"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEditedMessage}>
                                Salvar
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditing}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Modo de visualização
                          <div
                            className={`rounded-lg p-3 ${
                              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                            style={{
                              overflowWrap: "break-word",
                              wordWrap: "break-word",
                              wordBreak: "break-word",
                              hyphens: "auto",
                              whiteSpace: "pre-wrap",
                              maxWidth: "100%",
                            }}
                          >
                            <p style={{ maxWidth: "100%" }}>{message.content}</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-1">
                          {message.role === "assistant" && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(message.content)}>
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar
                              </Button>
                              <UseTextButton text={message.content} />
                            </>
                          )}
                          {message.role === "user" && !editingMessageId && (
                            <Button variant="ghost" size="sm" onClick={() => startEditingMessage(message)}>
                              <PenLine className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Bot className="h-12 w-12 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">Assistente de Copywriting</h3>
                <p className="text-muted-foreground mb-4">
                  Converse com a IA para criar textos persuasivos, anúncios, emails e muito mais.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-md">
                  {promptSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left h-auto py-2"
                      onClick={() => setInputMessage(suggestion)}
                    >
                      <span className="truncate">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Área de input */}
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage()
              }}
              className="flex gap-2"
            >
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />
              <Button type="submit" disabled={isSendingMessage || !inputMessage.trim()}>
                {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Pressione Enter para enviar, Shift+Enter para nova linha
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function UseTextButton({ text }: { text: string }) {
  const { toast } = useToast()
  const useTextFromChat = useCallback(
    (text: string) => {
      // Aqui você pode implementar a lógica para transferir o texto para o editor
      toast({
        title: "Texto transferido",
        description: "O texto foi transferido para o editor",
      })
    },
    [toast],
  )
  return (
    <Button variant="ghost" size="sm" onClick={() => useTextFromChat(text)}>
      <FileText className="h-3 w-3 mr-1" />
      Usar no Editor
    </Button>
  )
}
