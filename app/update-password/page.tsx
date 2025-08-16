import type { Metadata } from "next"
import AuthLayout from "../auth-layout"
import { UpdatePasswordForm } from "@/components/auth/update-password-form"

export const metadata: Metadata = {
  title: "Atualizar Senha",
  description: "Defina uma nova senha para sua conta",
}

export default function UpdatePasswordPage() {
  return (
    <AuthLayout>
      <UpdatePasswordForm />
    </AuthLayout>
  )
}
