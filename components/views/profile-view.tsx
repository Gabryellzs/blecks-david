"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import ImageCropperDialog from "@/components/image-cropper-dialog"

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

        const fetchedProfile = {
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
        setLastName(fetchedProfile.last_name || "")
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
          description: "Usuário não autenticado. Por favor, faça login novamente.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq("id", user.id)

      if (updateError) {
        throw updateError
      }

      toast({
        title: "Sucesso!",
        description: "Informações do perfil atualizadas.",
      })
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err.message || "Ocorreu um erro ao atualizar o perfil.",
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
          description: "Não foi possível encontrar o email do usuário. Por favor, faça login novamente.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (resetError) {
        throw resetError
      }

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      })
    } catch (err: any) {
      toast({
        title: "Erro ao enviar email",
        description: err.message || "Ocorreu um erro ao enviar o email de redefinição de senha.",
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
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setImageToCrop(reader.result as string)
        setShowCropper(true)
      }
      reader.readAsDataURL(file)
    }
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
        description: "Enviando sua nova foto de perfil para o Supabase Storage.",
      })

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          throw new Error(userError?.message || "Usuário não autenticado para atualizar o perfil.")
        }

        const fileExtension = croppedBlob.type.split("/")[1] || "png"
        const filePath = `${user.id}/${Date.now()}.${fileExtension}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, croppedBlob, {
            cacheControl: "3600",
            upsert: true,
            contentType: croppedBlob.type,
          })

        if (uploadError) {
          throw uploadError
        }

        const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath)

        if (!publicUrlData?.publicUrl) {
          throw new Error("Não foi possível obter a URL pública da imagem.")
        }

        const { error: updateDbError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrlData.publicUrl })
          .eq("id", user.id)

        if (updateDbError) {
          throw updateDbError
        }

        setProfile((prevProfile) => (prevProfile ? { ...prevProfile, avatar_url: publicUrlData.publicUrl } : null))
        toast({
          title: "Sucesso!",
          description: "Foto de perfil atualizada com sucesso no Supabase Storage.",
        })

        // NOVO: Disparar evento personalizado para atualizar o cabeçalho
        window.dispatchEvent(new CustomEvent("profile-avatar-updated", { detail: publicUrlData.publicUrl }))
      } catch (err: any) {
        toast({
          title: "Erro ao enviar foto",
          description: err.message || "Ocorreu um erro ao atualizar a foto de perfil.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Erro: {error}</p>
        <p>Por favor, tente novamente mais tarde.</p>
      </div>
    )
  }

  const displayName = firstName || profile?.full_name?.split(" ")[0] || profile?.email?.charAt(0).toUpperCase() || "U"

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="flex flex-col items-center">
          <div className="relative group cursor-pointer h-24 w-24 rounded-full mb-4" onClick={handleAvatarClick}>
            <Avatar className="h-full w-full">
              <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt="User Avatar" />
              <AvatarFallback className="text-4xl">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-sm">Trocar Foto</span>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" />
          </div>
          <Button variant="ghost" onClick={handleAvatarClick} className="mt-2 text-sm text-primary hover:underline">
            Trocar Foto
          </Button>
          <CardTitle className="text-2xl mt-2">
            {firstName} {lastName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Informações Pessoais</h2>
            <div>
              <Label htmlFor="firstName">Primeiro Nome</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <Button onClick={handleProfileUpdate} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h2 className="text-xl font-semibold">Trocar Senha</h2>
            <p className="text-sm text-muted-foreground">
              Clique no botão abaixo para receber um link de redefinição de senha no seu email.
            </p>
            <Button onClick={handlePasswordResetEmail} disabled={isSaving}>
              {isSaving ? "Enviando Email..." : "Enviar Link de Redefinição"}
            </Button>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h2 className="text-xl font-semibold">Assinatura</h2>
            <p className="text-sm text-muted-foreground">Gerencie seu plano de assinatura e detalhes de pagamento.</p>
            <Button onClick={handleManageSubscription}>Gerenciar Assinatura</Button>
          </div>
        </CardContent>
      </Card>

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
