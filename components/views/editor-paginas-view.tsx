"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, Mail, Instagram, ExternalLink, MousePointerClick } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export default function SuporteView() {
  const [assunto, setAssunto] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [categoria, setCategoria] = useState("")
  const [enviando, setEnviando] = useState(false)
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)

    // Simulação de envio
    setTimeout(() => {
      toast({
        title: "Mensagem enviada",
        description: "Sua solicitação de suporte foi enviada com sucesso. Responderemos em breve.",
      })
      setAssunto("")
      setMensagem("")
      setCategoria("")
      setEnviando(false)
    }, 1500)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Suporte</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Entre em contato</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center items-center py-10 space-y-4">
              <Button
                size="lg"
                className="text-lg font-medium py-6 px-8 flex items-center gap-3 bg-green-600 hover:bg-green-700"
                onClick={() => window.open("https://w.app/hbk0dp", "_blank")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="h-6 w-6"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                SUPORTE WHATSAPP
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Disponível de segunda a sexta, das 9h às 18h
                <br />
                Sábado das 9h às 16h
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Contatos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="w-full">
                  <p className="font-medium">Email</p>
                  <div className="flex flex-col gap-1">
                    <a
                      href="mailto:blacksproductivity@gmail.com"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      blacksproductivity@gmail.com
                      <ExternalLink className="h-3 w-3 inline-block ml-1" />
                    </a>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center self-start">
                      <MousePointerClick className="h-3 w-3 mr-1" />
                      Clicável
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Instagram className="h-5 w-5 text-muted-foreground" />
                <div className="w-full">
                  <p className="font-medium">Instagram</p>
                  <div className="flex flex-col gap-1">
                    <a
                      href="https://www.instagram.com/blacksproductivity"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      @blacksproductivity
                      <ExternalLink className="h-3 w-3 inline-block ml-1" />
                    </a>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center self-start">
                      <MousePointerClick className="h-3 w-3 mr-1" />
                      Clicável
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Perguntas Frequentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">Como posso alterar minha senha?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Acesse as configurações da sua conta e selecione a opção "Alterar senha".
                </p>
              </div>

              <div>
                <p className="font-medium">Como exportar meus dados?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Em cada módulo, você encontrará um botão de exportação no canto superior direito.
                </p>
              </div>

              <div>
                <p className="font-medium">Posso usar o sistema offline?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Algumas funcionalidades estão disponíveis offline, mas a sincronização requer conexão.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
