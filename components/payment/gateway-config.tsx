"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Copy, HelpCircle, Eye, EyeOff } from "lucide-react" // Adicionado Eye e EyeOff
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import type { PaymentGatewayType } from "@/lib/payment-gateway-types"
import { userWebhookService, type UserWebhook } from "@/lib/user-webhook-service"
import { webhookSecretService } from "@/lib/webhook-secret-service" // NOVO: Importar serviço de chaves secretas

const GATEWAY_OPTIONS = [
  { id: "kirvano", name: "Kirvano" },
  { id: "cakto", name: "Cakto" },
  { id: "kiwify", name: "Kiwify" },
  { id: "hotmart", name: "Hotmart" },
  { id: "monetizze", name: "Monetizze" },
  { id: "eduzz", name: "Eduzz" },
  { id: "pepper", name: "Pepper" },
  { id: "braip", name: "Braip" },
  { id: "lastlink", name: "Lastlink" },
  { id: "disrupty", name: "Disrupty" },
  { id: "perfectpay", name: "PerfectPay" },
  { id: "goatpay", name: "Goatpay" },
  { id: "tribopay", name: "Tribopay" },
  { id: "nuvemshop", name: "Nuvemshop" },
  { id: "woocommerce", name: "WooCommerce" },
  { id: "loja_integrada", name: "Loja Integrada" },
  { id: "cartpanda", name: "Cartpanda" },
] as const

export function GatewayConfig() {
  const [selectedGatewayId, setSelectedGatewayId] = useState<PaymentGatewayType | null>(null)
  const [webhookName, setWebhookName] = useState<string>("")
  const [generatedWebhookUrl, setGeneratedWebhookUrl] = useState<string>("")
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [userWebhooks, setUserWebhooks] = useState<UserWebhook[]>([])

  // NOVO: Estados para a chave secreta
  const [secretKey, setSecretKey] = useState<string>("")
  const [isSavingSecret, setIsSavingSecret] = useState(false)
  const [showSecret, setShowSecret] = useState(false) // Para alternar visibilidade da chave

  const selectedGateway = GATEWAY_OPTIONS.find((g) => g.id === selectedGatewayId)

  // Buscar o user_id e webhooks/secrets ao carregar o componente
  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        setIsLoadingUser(true)
        setAuthError(null)
        console.log("DEBUG: Buscando usuário autenticado e dados...")

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("DEBUG: Erro ao obter sessão:", sessionError)
          setAuthError("Erro ao verificar sessão de autenticação")
          return
        }

        if (!sessionData.session) {
          console.log("DEBUG: Nenhuma sessão ativa encontrada")
          setAuthError("Nenhuma sessão ativa encontrada")
          return
        }

        const user = sessionData.session.user
        if (user) {
          setUserId(user.id)
          console.log("DEBUG: User ID obtido para webhook:", user.id)
          setAuthError(null)

          // Carregar webhooks do Supabase para este usuário
          try {
            const webhooks = await userWebhookService.getWebhooksByUserId(user.id)
            setUserWebhooks(webhooks)
            console.log("DEBUG: Webhooks do usuário carregados do Supabase:", webhooks.length)
          } catch (webhookError) {
            console.error("DEBUG: Erro ao carregar webhooks do Supabase:", webhookError)
            toast({
              title: "Erro ao carregar webhooks",
              description: "Não foi possível carregar seus webhooks salvos.",
              variant: "destructive",
            })
          }
        } else {
          console.log("DEBUG: Usuário não encontrado na sessão")
          setAuthError("Usuário não encontrado na sessão")
        }
      } catch (error) {
        console.error("DEBUG: Exceção ao obter usuário:", error)
        setAuthError("Erro inesperado ao verificar autenticação")
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchUserAndData()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("DEBUG: Mudança na autenticação:", event)

      if (event === "SIGNED_IN" && session?.user) {
        setUserId(session.user.id)
        setAuthError(null)
        console.log("DEBUG: Usuário logado:", session.user.id)
        // Recarregar webhooks ao logar
        userWebhookService
          .getWebhooksByUserId(session.user.id)
          .then(setUserWebhooks)
          .catch((err) => console.error("Erro ao recarregar webhooks após login:", err))
      } else if (event === "SIGNED_OUT") {
        setUserId(null)
        setAuthError("Usuário deslogado")
        setUserWebhooks([])
        setSecretKey("") // Limpar chave secreta ao deslogar
        console.log("DEBUG: Usuário deslogado")
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Função para gerar a URL do webhook correta
  const generateWebhookUrl = useCallback((gatewayId: PaymentGatewayType, userId: string) => {
    if (!userId || !gatewayId) {
      console.log("DEBUG: Não é possível gerar URL - userId ou gatewayId ausente")
      return ""
    }

    const baseUrl = window.location.origin
    const url = `${baseUrl}/api/webhooks/gateway?gateway=${gatewayId}&user_id=${userId}`
    console.log("DEBUG: URL gerada:", url)
    return url
  }, [])

  // Atualizar campos quando o gateway selecionado ou userId muda
  useEffect(() => {
    const updateFields = async () => {
      if (selectedGatewayId && userId) {
        const gatewayName = selectedGateway?.name || selectedGatewayId
        const defaultName = `Webhook ${gatewayName}`
        setWebhookName(defaultName)

        // Carregar URL do webhook salvo
        const savedWebhook = userWebhooks.find((wh) => wh.gateway_id === selectedGatewayId)
        if (savedWebhook) {
          setGeneratedWebhookUrl(savedWebhook.webhook_url)
          console.log("DEBUG: URL existente encontrada para", selectedGatewayId, ":", savedWebhook.webhook_url)
        } else {
          const newUrl = generateWebhookUrl(selectedGatewayId, userId)
          setGeneratedWebhookUrl(newUrl)
          console.log("DEBUG: Nova URL gerada para", selectedGatewayId, ":", newUrl)
        }

        // NOVO: Carregar chave secreta salva
        try {
          const savedSecret = await webhookSecretService.getSecretByUserIdAndGateway(userId, selectedGatewayId)
          if (savedSecret) {
            setSecretKey(savedSecret.secret_key)
            console.log("DEBUG: Chave secreta existente carregada para", selectedGatewayId)
          } else {
            setSecretKey("") // Limpar se não houver chave salva
            console.log("DEBUG: Nenhuma chave secreta encontrada para", selectedGatewayId)
          }
        } catch (error) {
          console.error("DEBUG: Erro ao carregar chave secreta:", error)
          toast({
            title: "Erro ao carregar chave secreta",
            description: "Não foi possível carregar a chave secreta para este gateway.",
            variant: "destructive",
          })
          setSecretKey("") // Garantir que o campo esteja limpo em caso de erro
        }
      } else {
        setWebhookName("")
        setGeneratedWebhookUrl("")
        setSecretKey("") // Limpar chave secreta
        console.log("DEBUG: Limpando campos - gateway ou userId ausente")
      }
    }
    updateFields()
  }, [selectedGatewayId, userId, selectedGateway, userWebhooks, generateWebhookUrl])

  const handleGatewaySelect = (id: PaymentGatewayType) => {
    console.log("DEBUG: Gateway selecionado:", id)
    setSelectedGatewayId(id)
  }

  const handleCreateWebhook = async () => {
    console.log("DEBUG: Tentando criar webhook...", {
      selectedGatewayId,
      webhookName,
      userId,
      isLoadingUser,
    })

    if (!selectedGatewayId || !webhookName.trim() || !userId) {
      const missingFields = []
      if (!selectedGatewayId) missingFields.push("gateway")
      if (!webhookName.trim()) missingFields.push("nome")
      if (!userId) missingFields.push("usuário autenticado")

      toast({
        title: "Campos obrigatórios",
        description: `Por favor, verifique: ${missingFields.join(", ")}.`,
        variant: "destructive",
      })
      return
    }

    setIsCreatingWebhook(true)

    try {
      const newWebhookUrl = generateWebhookUrl(selectedGatewayId, userId)

      if (!newWebhookUrl) {
        throw new Error("Não foi possível gerar a URL do webhook")
      }

      const savedWebhook = await userWebhookService.saveWebhook(
        userId,
        selectedGatewayId,
        webhookName.trim(),
        newWebhookUrl,
      )

      if (!savedWebhook) {
        throw new Error("Falha ao salvar webhook no Supabase.")
      }

      setUserWebhooks((prev) => {
        const existingIndex = prev.findIndex((wh) => wh.id === savedWebhook.id)
        if (existingIndex > -1) {
          const updated = [...prev]
          updated[existingIndex] = savedWebhook
          return updated
        }
        return [...prev, savedWebhook]
      })

      setGeneratedWebhookUrl(newWebhookUrl)

      toast({
        title: "Webhook Criado/Atualizado com Sucesso!",
        description: `O webhook "${webhookName}" para ${selectedGateway?.name} foi salvo. Copie a URL e configure no painel do gateway.`,
      })

      console.log("DEBUG: Webhook salvo/atualizado com sucesso no Supabase:", {
        gateway: selectedGatewayId,
        userId,
        url: newWebhookUrl,
      })
    } catch (error) {
      console.error("DEBUG: Erro ao criar/salvar webhook:", error)
      toast({
        title: "Erro ao criar/salvar webhook",
        description: "Ocorreu um erro ao salvar o webhook. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingWebhook(false)
    }
  }

  // NOVO: Função para salvar a chave secreta
  const handleSaveSecret = async () => {
    console.log("DEBUG: Tentando salvar chave secreta...", {
      selectedGatewayId,
      userId,
      secretKey: "********", // Não logar a chave real
    })

    if (!selectedGatewayId || !secretKey.trim() || !userId) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione um gateway e insira a chave secreta.",
        variant: "destructive",
      })
      return
    }

    setIsSavingSecret(true)
    try {
      await webhookSecretService.saveSecret(userId, selectedGatewayId, secretKey.trim())
      toast({
        title: "Chave Secreta Salva!",
        description: `A chave secreta para ${selectedGateway?.name} foi salva com sucesso.`,
      })
      console.log("DEBUG: Chave secreta salva com sucesso para", selectedGatewayId)
    } catch (error) {
      console.error("DEBUG: Erro ao salvar chave secreta:", error)
      toast({
        title: "Erro ao salvar chave secreta",
        description: "Ocorreu um erro ao salvar a chave secreta. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSavingSecret(false)
    }
  }

  const handleCopyUrl = () => {
    if (generatedWebhookUrl) {
      navigator.clipboard.writeText(generatedWebhookUrl)
      toast({
        title: "URL Copiada!",
        description: "A URL do webhook foi copiada para a área de transferência.",
      })
      console.log("DEBUG: URL copiada:", generatedWebhookUrl)
    }
  }

  const handleRetryAuth = async () => {
    setIsLoadingUser(true)
    setAuthError(null)

    try {
      const { data: sessionData, error } = await supabase.auth.getSession()

      if (error || !sessionData.session) {
        setAuthError("Sessão não encontrada. Por favor, faça login novamente.")
        return
      }

      setUserId(sessionData.session.user.id)
      console.log("DEBUG: Autenticação recuperada:", sessionData.session.user.id)
    } catch (error) {
      console.error("DEBUG: Erro ao tentar recuperar autenticação:", error)
      setAuthError("Erro ao verificar autenticação")
    } finally {
      setIsLoadingUser(false)
    }
  }

  const renderHelpTooltip = (text: string) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground ml-1 cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  // Verificar se o botão de criar webhook deve estar habilitado
  const isCreateWebhookButtonEnabled =
    !isCreatingWebhook && !isLoadingUser && selectedGatewayId && webhookName.trim().length > 0 && userId && !authError

  // NOVO: Verificar se o botão de salvar chave secreta deve estar habilitado
  const isSaveSecretButtonEnabled =
    !isSavingSecret && !isLoadingUser && selectedGatewayId && secretKey.trim().length > 0 && userId && !authError

  console.log("DEBUG: Estado do botão CRIAR WEBHOOK:", {
    isCreateWebhookButtonEnabled,
    isCreatingWebhook,
    isLoadingUser,
    selectedGatewayId,
    webhookNameLength: webhookName.trim().length,
    userId: !!userId,
    authError,
  })
  console.log("DEBUG: Estado do botão SALVAR CHAVE SECRETA:", {
    isSaveSecretButtonEnabled,
    isSavingSecret,
    isLoadingUser,
    selectedGatewayId,
    secretKeyLength: secretKey.trim().length,
    userId: !!userId,
    authError,
  })

  return (
    <Card className="w-full neon-card neon-card-blue">
      <CardHeader>
        <CardTitle>Configuração de Webhooks de Gateways</CardTitle>
        <CardDescription>
          Configure as URLs de webhook e chaves secretas para receber notificações em tempo real dos gateways.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-2 mb-6">
            {GATEWAY_OPTIONS.map((gateway) => (
              <Button
                key={gateway.id}
                variant="outline"
                onClick={() => handleGatewaySelect(gateway.id as PaymentGatewayType)}
                className={cn(
                  "relative hover:text-blue-500 hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]",
                  selectedGatewayId === gateway.id &&
                    "text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] border-blue-500",
                )}
              >
                {gateway.name}
                {userWebhooks.some((wh) => wh.gateway_id === gateway.id) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                )}
              </Button>
            ))}
          </div>

          {isLoadingUser && (
            <div className="flex items-center justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
              <span className="text-sm text-muted-foreground">Verificando autenticação...</span>
            </div>
          )}

          {!isLoadingUser && authError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <p className="text-sm text-destructive mb-2">{authError}</p>
              <Button variant="outline" size="sm" onClick={handleRetryAuth}>
                Tentar Novamente
              </Button>
            </div>
          )}

          {selectedGatewayId && userId && !isLoadingUser && !authError && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="webhook-name">Nome</Label>
                <Input
                  id="webhook-name"
                  placeholder="Nome do Webhook"
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="generated-webhook-url">URL</Label>
                  {renderHelpTooltip(
                    `Esta URL deve ser configurada no painel do ${selectedGateway?.name} para receber notificações de vendas em tempo real. A URL inclui seu ID de usuário e o gateway específico.`,
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="generated-webhook-url"
                    readOnly
                    value={generatedWebhookUrl}
                    placeholder="Gerada automaticamente após a criação"
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    disabled={!generatedWebhookUrl}
                    className="shrink-0 bg-transparent"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Agora basta cadastrar o link acima na plataforma de vendas {selectedGateway?.name}:
                </p>
              </div>

              {/* NOVO: Campo para a Chave Secreta */}
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="secret-key">Chave Secreta do Webhook</Label>
                  {renderHelpTooltip(
                    `Insira a chave secreta fornecida pelo ${selectedGateway?.name}. Esta chave é usada para verificar a autenticidade das notificações de venda.`,
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="secret-key"
                    type={showSecret ? "text" : "password"} // Alternar tipo para mostrar/esconder
                    placeholder="Insira a chave secreta do gateway"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSecret((prev) => !prev)} // Alternar visibilidade
                    className="shrink-0"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveSecret}
                    disabled={!isSaveSecretButtonEnabled}
                    className="shrink-0"
                  >
                    {isSavingSecret ? "Salvando..." : "Salvar Chave"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Guarde esta chave em segurança. Ela é essencial para validar as vendas.
                </p>
              </div>

              <div className="flex flex-col space-y-2">
                <Button
                  onClick={handleCreateWebhook}
                  disabled={!isCreateWebhookButtonEnabled}
                  className={cn(
                    "hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]",
                    !isCreateWebhookButtonEnabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {isCreatingWebhook ? "Criando Webhook..." : "CRIAR WEBHOOK"}
                </Button>

                {!isCreateWebhookButtonEnabled && !isLoadingUser && !authError && (
                  <p className="text-xs text-muted-foreground text-center">
                    {!selectedGatewayId && "Selecione um gateway"}
                    {selectedGatewayId && !webhookName.trim() && "Digite um nome para o webhook"}
                    {selectedGatewayId && webhookName.trim() && !userId && "Usuário não autenticado"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          As URLs de webhook são armazenadas localmente e direcionam para gateway_transactions.
        </p>
        <a href="#" className="text-sm text-blue-400 hover:underline">
          Clique aqui para ver como integrar
        </a>
      </CardFooter>
    </Card>
  )
}
