import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

export default function AssinaturasPage() {
  console.log("[v0] AssinaturasPage rendering")

  const plans = [
    {
      name: "Teste 7 Dias Grátis",
      price: "R$ 0,00",
      period: "/mês",
      description: "Perfeito para começar sua jornada no marketing digital",
      features: [
        "Até 1.000 copys por mês",
        "Templates básicos",
        "Suporte por email",
        "Dashboard básico",
        "Integração com 3 plataformas",
      ],
      buttonText: "Começar Agora",
    },
    {
      name: "Premium",
      price: "R$ 96,99",
      period: "/mês",
      description: "Para profissionais que querem escalar seus resultados",
      features: [
        "Copys ilimitadas",
        "Todos os templates premium",
        "Suporte prioritário 24/7",
        "Dashboard avançado com analytics",
        "Integração com todas as plataformas",
        "IA personalizada para seu nicho",
        "Relatórios detalhados",
        "Automação de campanhas",
      ],
      buttonText: "Escolher Plano",
    },
    {
      name: "Platinum",
      price: "R$ 196,99",
      period: "/mês",
      description: "Solução completa para agências e grandes empresas",
      features: [
        "Tudo do Professional",
        "Múltiplas contas de usuário",
        "White label disponível",
        "Gerente de conta dedicado",
        "Treinamento personalizado",
        "API personalizada",
        "Integração customizada",
        "SLA garantido",
      ],
      buttonText: "Escolher Plano",
    },
    {
      name: "Master Black",
      price: "R$ 396,99",
      period: "/mês",
      description: "Solução premium para grandes corporações e franquias",
      features: [
        "Tudo do Enterprise",
        "Usuários ilimitados",
        "Múltiplas marcas/empresas",
        "Consultoria estratégica mensal",
        "Desenvolvimento de features customizadas",
        "Integração com qualquer sistema",
        "Suporte 24/7 com SLA de 1 hora",
        "Treinamento presencial da equipe",
        "Dashboard executivo personalizado",
      ],
      buttonText: "Escolher Plano",
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">

      {/* Fundo premium cinza metálico */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-20 h-72 w-72 rounded-full bg-[#d1d1d1]/15 blur-3xl" />
        <div className="absolute -bottom-40 right-[-60px] h-80 w-80 rounded-full bg-[#e5e5e5]/15 blur-3xl" />
        <div className="absolute inset-x-0 top-1/3 h-px bg-gradient-to-r from-transparent via-[#d1d1d1]/20 to-transparent" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-16">

        {/* HERO */}
        <div className="text-center mb-12 space-y-4 mt-[40px]">
          <h1 className="text-4xl md:text-6xl font-bold mb-2">
            ESCOLHA O PLANO
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d1d1d1] via-[#e5e5e5] to-[#f2f2f2]">
              {" "}
              PERFEITO PARA SUA OPERAÇÃO
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-1xl mx-auto">
            Transforme sua estratégia de marketing com uma plataforma de IA pensada para quem leva resultados a sério.
          </p>
        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, i) => {
            const isFeatured = i === 2 // PLATINUM DESTAQUE

            return (
              <div key={plan.name} className="group [perspective:1400px] relative">

                {/* BADGE ESPECIAL */}
                {isFeatured && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20">
                    <div className="px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                      bg-[#d1d1d1] text-black shadow-[0_0_18px_rgba(220,220,220,0.8)]">
                      MAIS VENDIDO
                    </div>
                  </div>
                )}

                <Card
                  className={`
                    relative flex flex-col h-[480px] bg-white/6 backdrop-blur-xl rounded-2xl overflow-hidden
                    border border-white/10 shadow-[0_0_0_2px_rgba(255,255,255,0.05)]
                    transition-all duration-500

                    ${isFeatured
                      ? `
                        scale-[1.07]
                        hover:scale-[1.10]
                        border-[#d1d1d1]/50
                        shadow-[0_0_40px_rgba(220,220,220,0.55)]
                        hover:shadow-[0_0_55px_rgba(230,230,230,0.9)]
                      `
                      : `
                        hover:-translate-y-2 hover:shadow-[0_0_28px_rgba(210,210,210,0.25)]
                      `
                    }

                    [transform-style:preserve-3d]
                    hover:[transform:rotateX(6deg)_rotateY(-4deg)]
                  `}
                >

                  <CardHeader className="text-center pb-4 pt-6 space-y-2">
                    <CardTitle className="text-xl font-bold text-white">
                      {plan.name}
                    </CardTitle>

                    <div className="flex items-end justify-center gap-1">
                      <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                      <span className="text-gray-300 text-xs mb-1">{plan.period}</span>
                    </div>

                    <CardDescription className="text-gray-300 text-xs">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-5 pb-5 space-y-3 flex-1 flex flex-col">
                    <ul className="space-y-2 flex-1 text-xs">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check size={14} className="text-[#d1d1d1] mt-0.5" />
                          <span className="text-gray-200">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* BOTÃO NEON */}
                    <Button
                      className={`w-full py-2.5 text-sm font-semibold rounded-xl 
                        transition-all duration-300 relative overflow-hidden
                        bg-black/40 text-white border border-[#d1d1d1]/40 
                        before:absolute before:inset-0 before:rounded-xl 
                        before:bg-[linear-gradient(90deg,transparent,rgba(209,209,209,0.35),transparent)] 
                        before:opacity-70 before:blur-[6px] 
                        before:transition-opacity before:duration-500
                        hover:before:opacity-100
                        shadow-[0_0_12px_rgba(209,209,209,0.45)] 
                        hover:shadow-[0_0_22px_rgba(209,209,209,0.8)]
                      `}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>

                </Card>
              </div>
            )
          })}
        </div>

        {/* Info adicional */}
        <div className="text-center mt-12 space-y-2">
          <p className="text-gray-400 text-sm">
            Todos os planos incluem teste gratuito de 7 dias. Cancele a qualquer momento.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d1d1d1]" />
              Suporte no WhatsApp
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e5e5e5]" />
              Garantia 7 dias
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f2f2f2]" />
              Pagamento seguro
            </span>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  )
}
