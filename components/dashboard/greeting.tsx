"use client"

import { useEffect, useState } from "react"

import { getTimeBasedGreeting } from "@/lib/utils"
import { Logo } from "@/components/logo"

interface GreetingProps {
  firstName: string
}

export function Greeting({ firstName }: GreetingProps) {
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    // Update greeting every minute to handle time changes
    const updateGreeting = () => {
      setGreeting(getTimeBasedGreeting())
    }

    updateGreeting()
    const interval = setInterval(updateGreeting, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-2 mb-2">
        <Logo className="text-white" />
        <span className="font-bold text-lg">BLACK's</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">
        {greeting}, {firstName}!
      </h1>
    </div>
  )
}
