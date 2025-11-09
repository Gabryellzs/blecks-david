"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PenLine, Copy, Trash2, FileText, Send, Loader2, Mic, MicOff, Bot, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Tipos
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

export default function ChatView() {
  // chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState<string>("")
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false)

  // conversas salvas (sidebar à esquerda)
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversationTitle, setConversationTitle] = useState<string>("Conversa")

  // edição
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedMessageContent, setEditedMessageContent] = useState<string>("")

  // áudio
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const chatEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // ===== persistência =====
  const saveCurrentConversation = useCallback(
    (messages: ChatMessage[] = chatMessages) => {
      if (messages.length === 0) return
      const now = new Date()

      if (currentConversationId) {
        setSavedConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? { ...conv, messages, title: conversationTitle || conv.title, updatedAt: now }
              : conv,
          ),
        )
      } else {
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

  useEffect(() => {
    const raw = localStorage.getItem("copywritingConversations")
    if (raw) {
      try {
        setSavedConversations(JSON.parse(raw))
      } catch (e) {
        console.error("Erro ao carregar conversas:", e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("copywritingConversations", JSON.stringify(savedConversations))
  }, [savedConversations])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // ===== envio =====
  const sendMessage = useCallback(async () => {
    const text = inputMessage.trim()
    if (!text) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }

    const updatedMessages = [...chatMessages, userMessage]
    setChatMessages(updatedMessages)
    setInputMessage("")
    setIsSendingMessage(true)

    let assistantMessage: ChatMessage | null = null

    try {
      const recentMessages = updatedMessages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify({ messages: recentMessages }),
      })

      const ok = response.ok
      let data: any = null
      try {
        data = await response.json()
      } catch {
        // se voltou texto cru
        const txt = await response.text()
        data = { message: txt }
      }

      const content =
        (data && typeof data.message === "string" && data.message.trim()) ||
        (ok
          ? "Recebi sua mensagem, mas não consegui gerar uma resposta legível."
          : `Erro ${response.status}: ${response.statusText}`)

      assistantMessage = {
        id: `${Date.now()}-ai`,
        role: "assistant",
        content,
        timestamp: new Date(),
      }

      setChatMessages([...updatedMessages, assistantMessage])

      if (currentConversationId === null && !conversationTitle) {
        const t = userMessage.content.substring(0, 20)
        setConversationTitle(`Conversa sobre ${t}${userMessage.content.length > 20 ? "..." : ""}`)
      }
    } catch (error: any) {
      console.error("Erro ao enviar:", error)

      assistantMessage = {
        id: `${Date.now()}-ai`,
        role: "assistant",
        content:
          "Desculpe, não consegui processar sua mensagem agora. Verifique se a rota /api/chat está ativa. (Um mock simples já foi incluído no arquivo app/api/chat/route.ts.)",
        timestamp: new Date(),
      }
      setChatMessages([...updatedMessages, assistantMessage])

      toast({
        title: "Falha ao contatar o backend",
        description: "Use o mock incluso em /api/chat/route.ts ou configure seu OPENAI_API_KEY.",
        variant: "destructive",
      })
    } finally {
      setIsSendingMessage(false)
      saveCurrentConversation(assistantMessage ? [...updatedMessages, assistantMessage] : updatedMessages)
    }
  }, [chatMessages, inputMessage, currentConversationId, conversationTitle, saveCurrentConversation, toast])

  // ===== conversas =====
  const loadConversation = (id: string) => {
    const conversation = savedConversations.find((conv) => conv.id === id)
    if (conversation) {
      setChatMessages(conversation.messages)
      setCurrentConversationId(conversation.id)
      setConversationTitle(conversation.title)
      toast({ title: "Conversa carregada", description: conversation.title })
    }
  }

  const deleteConversation = (id: string) => {
    setSavedConversations((prev) => prev.filter((conv) => conv.id !== id))
    if (currentConversationId === id) {
      setChatMessages([])
      setCurrentConversationId(null)
      setConversationTitle("Conversa")
    }
    toast({ title: "Excluído", description: "Conversa removida com sucesso" })
  }

  // ===== edição =====
  const startEditingMessage = useCallback((message: ChatMessage) => {
    setEditingMessageId(message.id)
    setEditedMessageContent(message.content)
  }, [])

  const saveEditedMessage = useCallback(() => {
    if (!editingMessageId) return
    const updated = chatMessages.map((m) => (m.id === editingMessageId ? { ...m, content: editedMessageContent } : m))
    setChatMessages(updated)
    saveCurrentConversation(updated)
    setEditingMessageId(null)
    setEditedMessageContent("")
    toast({ title: "Mensagem atualizada", description: "Sua mensagem foi editada com sucesso" })
  }, [chatMessages, editingMessageId, editedMessageContent, saveCurrentConversation, toast])

  const cancelEditing = () => {
    setEditingMessageId(null)
    setEditedMessageContent("")
  }

  // ===== util =====
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência" })
  }

  // ===== áudio/transcrição =====
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      audioChunksRef.current = []

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        stream.getTracks().forEach((t) => t.stop())

        setIsTranscribing(true)
        try {
          const form = new FormData()
          form.append("file", blob, "audio.webm")
          const res = await fetch("/api/transcribe", { method: "POST", body: form })
          if (res.ok) {
            const data = await res.json()
            const text = data?.text || ""
            setInputMessage((prev) => (prev ? `${prev} ${text}` : text))
          } else {
            toast({
              title: "Transcrição indisponível",
              description: "Implemente /api/transcribe ou remova o botão do microfone.",
              variant: "destructive",
            })
          }
        } catch {
          toast({
            title: "Falha na transcrição",
            description: "Verifique backend/permissões do navegador.",
            variant: "destructive",
          })
        } finally {
          setIsTranscribing(false)
        }
      }

      mr.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Erro ao acessar microfone:", err)
      toast({
        title: "Permissão negada",
        description: "Não consegui acessar o microfone.",
        variant: "destructive",
      })
    }
  }

  function stopRecording() {
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== "inactive") {
      mr.stop()
      setIsRecording(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      {/* COLUNA ESQUERDA: HISTÓRICO */}
      <Card className="md:col-span-1 h-full flex flex-col">
        <CardHeader className="p-4">
          <CardTitle className="text-lg">Histórico</CardTitle>
        </CardHeader>
        <CardContent className="p-2 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-2">
              {savedConversations.length > 0 ? (
                savedConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-2 rounded-md cursor-pointer flex items-center justify-between ${
                      currentConversationId === conv.id ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                    onClick={() => loadConversation(conv.id)}
                  >
                    <div>
                      <p className="font-medium truncate text-sm">{conv.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 w-8 h-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conv.id)
                      }}
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

      {/* COLUNA DIREITA: CHAT */}
      <Card className="md:col-span-2 h-full flex flex-col">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg">{conversationTitle || "Conversa"}</CardTitle>
          <CardDescription>Converse com a IA para criar e melhorar seus textos de copywriting</CardDescription>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col">
          {/* MENSAGENS (sem sugestões iniciais) */}
          <ScrollArea className="flex-1 p-4">
            {chatMessages.length > 0 ? (
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                      style={{ maxWidth: "60%" }}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0 bg-muted text-foreground">
                        <AvatarFallback className="p-0">
                          {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        {editingMessageId === message.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editedMessageContent}
                              onChange={(e) => setEditedMessageContent(e.target.value)}
                              className="min-h-[100px] w-full"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEditedMessage}>Salvar</Button>
                              <Button size="sm" variant="outline" onClick={cancelEditing}>Cancelar</Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`rounded-lg p-3 ${
                              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                            style={{
                              overflowWrap: "break-word",
                              wordWrap: "break-word",
                              wordBreak: "break-word",
                              whiteSpace: "pre-wrap",
                              maxWidth: "100%",
                            }}
                          >
                            <p>{message.content}</p>
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
              <div className="h-full flex items-center justify-center text-center p-4">
                <p className="text-muted-foreground">
                  Converse com a IA para criar e melhorar seus textos de copywriting
                </p>
              </div>
            )}
          </ScrollArea>

          {/* INPUT + MIC À ESQUERDA DO ENVIAR */}
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

              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                title={isRecording ? "Parar gravação" : "Gravar áudio"}
                aria-label={isRecording ? "Parar gravação" : "Gravar áudio"}
              >
                {isTranscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>

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
    (t: string) => {
      toast({ title: "Texto transferido", description: "O texto foi transferido para o editor" })
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
