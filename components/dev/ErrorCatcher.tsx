"use client"

import React from "react"

export function ErrorCatcher({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <React.Suspense fallback={null}>
      <Boundary name={name}>{children}</Boundary>
    </React.Suspense>
  )
}

class Boundary extends React.Component<{ name: string; children: React.ReactNode }, { err?: any }> {
  state = { err: undefined as any }

  static getDerivedStateFromError(err: any) {
    return { err }
  }

  componentDidCatch(error: any, info: any) {
    // Log detalhado no console
    // eslint-disable-next-line no-console
    console.error(`[Boundary] Erro dentro de <${this.props.name}>`, error, info?.componentStack)
  }

  render() {
    if (this.state.err) {
      return (
        <div style={{ border: "1px dashed #f87171", padding: 8, margin: "8px 0" }}>
          <strong>Falha em: {this.props.name}</strong>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
            {String(this.state.err?.message ?? this.state.err)}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
