"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Phone, User } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export function RegisterForm() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "Senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phone,
          },
        },
      })

      if (error) throw error

      toast({
        title: "Registro realizado com sucesso!",
        description: "Verifique seu email para confirmar sua conta.",
      })

      router.push("/login")
    } catch (error: any) {
      toast({
        title: "Erro ao registrar",
        description: error?.message || "Ocorreu um erro ao registrar sua conta.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // ÚNICA MUDANÇA REAL: esse container virou fixed + inset-0
    <div className="fixed inset-0 flex w-full items-center justify-center bg-black px-4 overflow-hidden">
      {/* FUNDO CINZA LUXO */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black via-[#0b0b0c] to-black" />

      {/* CINZA CENTRAL SUAVE */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(180,180,185,0.16),transparent_60%)] opacity-80" />

      {/* FAIXA DIAGONAL CINZA */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(200,200,210,0.14),transparent_40%)]" />

      {/* LINHAS METÁLICAS */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-600/30 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent" />

      {/* TEXTURA CINZA (ruído leve) */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-soft-light [background-image:radial-gradient(circle_at_1px_1px,#ffffff_0.5px,transparent_0)] [background-size:6px_6px]" />

      {/* CONTEÚDO – IGUAL AO SEU ORIGINAL */}
      <div className="relative z-10 flex h-full w-full max-w-7xl flex-col items-center gap-10 lg:flex-row lg:items-stretch">
        {/* LOGO */}
        <div className="flex h-full w-full items-center justify-center lg:w-5/12">
          <div className="relative flex items-center justify-center">
            <img
              src="/favicon.ico"
              alt="BLECK'S"
              className="logo-floating relative max-h-[100vh] w-auto max-w-[500px] object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            />
          </div>
        </div>

        {/* CARD – MESMAS CLASSES QUE VOCÊ MANDOU (central + translate-x-8) */}
        <div className="flex h-full w-full items-center justify-center lg:w-7/12 translate-x-8">
          <div className="relative w-full max-w-[800px]">
            {/* AURA CINZA DISCRETA AO REDOR DO CARD */}
            <div className="pointer-events-none absolute -inset-[3px] rounded-[24px] bg-[linear-gradient(135deg,rgba(180,180,185,0.45),rgba(10,10,12,0.9),rgba(160,160,170,0.45))] opacity-45 blur-[7px]" />

            {/* CARD PRINCIPAL */}
            <div className="relative w-full rounded-[18px] border border-zinc-600/70 bg-[#050506] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12 shadow-[0_40px_120px_rgba(0,0,0,0.85)]">
              {/* HEAD DO CARD */}
              <div className="mb-8 space-y-2 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
                  Criar sua conta
                </h2>
                <p className="text-sm text-zinc-400 max-w-md lg:max-w-none mx-auto lg:mx-0">
                  Leva menos de 1 minuto. Preencha seus dados para liberar o acesso à plataforma.
                </p>
              </div>

              {/* FORM */}
              <form onSubmit={onSubmit} className="space-y-7">
                {/* NOME */}
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-medium text-zinc-100">
                    Nome Completo
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                    <Input
                      placeholder="João Silva"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-11 sm:h-12 w-full rounded-2xl border border-zinc-800 bg-[#09090b] pl-12 text-sm text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-medium text-zinc-100">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                    <Input
                      type="email"
                      placeholder="exemplo@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 sm:h-12 w-full rounded-2xl border border-zinc-800 bg-[#09090b] pl-12 text-sm text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                {/* TELEFONE */}
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-medium text-zinc-100">
                    Telefone (WhatsApp)
                  </Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                    <Input
                      placeholder="(62) 8195-3700"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="h-11 sm:h-12 w-full rounded-2xl border border-zinc-800 bg-[#09090b] pl-12 text-sm text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                {/* SENHAS */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-zinc-100">Senha</Label>
                    <PasswordInput
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 sm:h-12 rounded-2xl border border-zinc-800 bg-[#09090b] text-sm text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-zinc-100">
                      Confirmar Senha
                    </Label>
                    <PasswordInput
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-11 sm:h-12 rounded-2xl border border-zinc-800 bg-[#09090b] text-sm text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                {/* BOTÃO */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="group relative mt-1 h-11 sm:h-12 w-full overflow-hidden rounded-2xl bg-zinc-100 text-base sm:text-lg font-semibold tracking-tight text-black shadow-[0_20px_40px_rgba(0,0,0,0.9)] transition-all duration-300 hover:bg-zinc-200 hover:shadow-[0_26px_70px_rgba(0,0,0,1)]"
                >
                  <span className="relative z-10">
                    {isLoading ? "Registrando..." : "Registrar agora"}
                  </span>
                </Button>
              </form>

              {/* LINK LOGIN */}
              <div className="mt-7 text-center text-xs sm:text-sm text-zinc-300">
                Já tem uma conta?{" "}
                <Link href="/login" className="font-medium text-zinc-200 hover:underline">
                  Faça login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ANIMAÇÃO DA LOGO */}
      <style jsx>{`
        .logo-floating {
          animation: floatLogo 7s ease-in-out infinite;
          transform-origin: center center;
        }

        @keyframes floatLogo {
          0% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.01);
          }
          100% {
            transform: translateY(0px) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
