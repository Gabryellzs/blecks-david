import type { Metadata } from "next"

import { RegisterForm } from "@/components/auth/register-form"
import AuthLayout from "../auth-layout"

export const metadata: Metadata = {
  title: "Register",
  description: "Create an account",
}

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  )
}
