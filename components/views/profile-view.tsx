"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import ImageCropperDialog from "@/components/image-cropper-dialog"
import { KeyRound, CreditCard, ArrowLeft } from "lucide-react"

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  phone: string | null
  avatar_url: string | null
}

export default function ProfileView() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)

  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setError(userError?.message || "Usuário não autenticado.")
          setLoading(false)
          return
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name, phone, avatar_url")
          .eq("id", user.id)
          .single()

        if (profileError) {
          setError(profileError.message)
          setLoading(false)
          return
        }

        const fetchedProfile: UserProfile = {
          id: user.id,
          email: user.email || "N/A",
          first_name: data?.first_name || null,
          last_name: data?.last_name || null,
          full_name: data?.full_name || null,
          phone: data?.phone || null,
          avatar_url: data?.avatar_url || null,
        }

        setProfile(fetchedProfile)
        setFirstName(fetchedProfile.first_name || "")
        setLastName(
          fetchedProfile.last_name?.toLowerCase() === "null"
            ? ""
            : fetchedProfile.last_name || "",
        )
      } catch (err: any) {
        setError(err.message || "Erro ao carregar perfil.")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleProfileUpdate = async () => {
    setIsSaving(true)
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        toast({
          title: "Erro",
          description:
            "Usuário não autenticado. Por favor, faça login novamente.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName || null,
          last_name:
            !lastName || lastName.toLowerCase() === "null" ? null : lastName,
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      toast({
        title: "Sucesso!",
        description: "Informações do perfil atualizadas.",
      })
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description:
          err.message || "Ocorreu um erro ao atualizar o perfil.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordResetEmail = async () => {
    setIsSaving(true)
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user || !user.email) {
        toast({
          title: "Erro",
          description: "Não foi possível encontrar o email do usuário.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        user.email,
        {
          redirectTo: `${window.location.origin}/update-password`,
        },
      )

      if (resetError) throw resetError

      toast({
        title: "Email enviado!",
        description:
          "Verifique sua caixa de entrada para redefinir sua senha.",
      })
    } catch (err: any) {
      toast({
        title: "Erro ao enviar email",
        description:
          err.message ||
          "Ocorreu um erro ao enviar o email de redefinição de senha.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleManageSubscription = () => {
    router.push("/dashboard/subscription-management")
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setImageToCrop(reader.result as string)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCroppedImageUpload = useCallback(
    async (croppedBlob: Blob | null) => {
      setShowCropper(false)
      setImageToCrop(null)

      if (!croppedBlob) {
        toast({
          title: "Erro",
          description: "Nenhuma imagem cortada foi fornecida.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Carregando...",
        description: "Enviando sua nova foto de perfil.",
      })

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          throw new Error(userError?.message || "Usuário não autenticado.")
        }

        const fileExtension = croppedBlob.type.split("/")[1] || "png"
        const filePath = `${user.id}/${Date.now()}.${fileExtension}`

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, croppedBlob, {
            cacheControl: "3600",
            upsert: true,
            contentType: croppedBlob.type,
          })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath)

        if (!publicUrlData?.publicUrl) {
          throw new Error("Não foi possível obter a URL pública da imagem.")
        }

        const { error: updateDbError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrlData.publicUrl })
          .eq("id", user.id)

        if (updateDbError) throw updateDbError

        setProfile((prev) =>
          prev ? { ...prev, avatar_url: publicUrlData.publicUrl } : prev,
        )

        toast({
          title: "Sucesso!",
          description: "Foto de perfil atualizada com sucesso.",
        })

        window.dispatchEvent(
          new CustomEvent("profile-avatar-updated", {
            detail: publicUrlData.publicUrl,
          }),
        )
      } catch (err: any) {
        toast({
          title: "Erro ao enviar foto",
          description:
            err.message || "Ocorreu um erro ao atualizar a foto de perfil.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto text-center text-red-500">
        <p>Erro: {error}</p>
        <p>Por favor, tente novamente mais tarde.</p>
      </div>
    )
  }

  const safeLastName =
    lastName && lastName.toLowerCase() !== "null" ? lastName : ""
  const displayName =
    [firstName, safeLastName].filter(Boolean).join(" ") ||
    profile?.email ||
    ""

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho com botão Voltar */}
      <div className="space-y-4">
        {/* Botão Voltar */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 w-fit px-3 py-1.5 rounded-full 
                     bg-white/5 border border-white/10 text-white/70 text-xs 
                     hover:bg-white/10 hover:text-white transition-all 
                     shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md"
        >
          <ArrowLeft size={14} />
          Voltar
        </button>

        {/* Avatar + nome + email */}
        <div className="flex items-center gap-4">
          <div
            className="relative group cursor-pointer h-16 w-16 md:h-20 md:w-20 rounded-full border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:scale-105 transition"
            onClick={handleAvatarClick}
          >
            <Avatar className="h-full w-full">
              <AvatarImage
                src={profile?.avatar_url || "/placeholder-user.jpg"}
                alt="User Avatar"
              />
              <AvatarFallback className="text-xl md:text-2xl">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <span className="text-white text-[10px] md:text-xs">
                Trocar foto
              </span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              className="hidden"
              accept="image/*"
            />
          </div>

          <div className="space-y-0.5">
            <h1 className="text-xl md:text-2xl font-semibold text-white/90">
              {displayName}
            </h1>
            <p className="text-xs md:text-sm text-white/60">
              {profile?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Grid principal (cards em estilo glass) */}
      <div className="grid gap-4 md:grid-cols-3 items-stretch">
        {/* Informações pessoais - 2 colunas */}
        <section className="relative md:col-span-2 space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.65)] overflow-hidden min-h-[220px]">
          {/* Glows de fundo */}
          <div className="pointer-events-none absolute -right-24 -top-16 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative space-y-4">
            <h2 className="text-sm md:text-base font-semibold text-white/90">
              Informações Pessoais
            </h2>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label
                  htmlFor="firstName"
                  className="text-xs md:text-sm text-white/70"
                >
                  Primeiro Nome
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 h-10 bg-black/60 border-white/15 text-sm text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <Label
                  htmlFor="lastName"
                  className="text-xs md:text-sm text-white/70"
                >
                  Sobrenome
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 h-10 bg-black/60 border-white/15 text-sm text-white placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="pt-1">
              <Button
                onClick={handleProfileUpdate}
                disabled={isSaving}
                className="w-full md:w-auto h-10 px-5 bg.white/10 hover:bg-white/20 text-xs md:text-sm text-white border border-white/20 transition-all hover:-translate-y-[1px]"
              >
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </section>

        {/* Coluna lateral: senha + assinatura */}
        <div className="space-y-4">
          {/* Trocar senha - card melhorado */}
          <section className="rounded-2xl border border-white/12 bg-gradient-to-br from-white/5 to-black/60 p-4 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.7)] min-h-[170px] flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/8 flex items-center justify-center">
                  <KeyRound size={16} className="text-sky-300" />
                </div>
                <h2 className="text-sm font-semibold text-white/90">
                  Trocar Senha
                </h2>
              </div>
              <p className="text-[11px] text-white/60">
                Enviaremos um link seguro para você redefinir sua senha pelo
                email cadastrado.
              </p>
            </div>
            <Button
              onClick={handlePasswordResetEmail}
              disabled={isSaving}
              className="w-full h-10 text-[11px] bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all hover:-translate-y-[1px]"
            >
              {isSaving ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
          </section>

          {/* Assinatura - card melhorado */}
          <section className="rounded-2xl border border-white/12 bg-gradient-to-br from-white/5 to-black/60 p-4 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.7)] min-h-[170px] flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/8 flex items-center justify-center">
                  <CreditCard size={16} className="text-emerald-300" />
                </div>
                <h2 className="text-sm font-semibold text-white/90">
                  Assinatura
                </h2>
              </div>
              <p className="text-[11px] text.white/60">
                Veja detalhes do seu plano, forma de pagamento e opções de
                alteração ou cancelamento.
              </p>
            </div>
            <Button
              onClick={handleManageSubscription}
              className="w-full h-10 text-[11px] bg-primary text-black font-semibold rounded-md hover:brightness-110 transition-all hover:-translate-y-[1px]"
            >
              Gerenciar Assinatura
            </Button>
          </section>
        </div>
      </div>

      {imageToCrop && (
        <ImageCropperDialog
          imageSrc={imageToCrop}
          isOpen={showCropper}
          onClose={() => setShowCropper(false)}
          onCropComplete={handleCroppedImageUpload}
        />
      )}
    </div>
  )
}
