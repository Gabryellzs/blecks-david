import type { Metadata } from "next"
import AuthLayout from "../auth-layout"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Recuperar Senha",
  description: "Recupere sua senha para acessar sua conta",
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  )
}
