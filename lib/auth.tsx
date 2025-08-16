"use client"

import type React from "react"
import { useState, useEffect, useContext, createContext } from "react"
import { supabase } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getActiveSession = async () => {
      setLoading(true)
      setError(null)
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Auth getSession error:", sessionError)
          setError(sessionError.message)
          setSession(null)
          setUser(null)
        } else {
          setSession(session)
          setUser(session?.user || null)
        }
      } catch (err: any) {
        console.error("Unexpected error in getActiveSession:", err)
        setError(err.message || "An unexpected error occurred during session retrieval.")
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getActiveSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const isAuthenticated = !!session && !!user
  const authContextValue = { session, user, loading, isAuthenticated, error }

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
