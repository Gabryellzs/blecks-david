import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Star } from "lucide-react"

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
      popular: false,
      buttonText: "Começar Agora",
    },
    {
      name: " Premium ",
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
      popular: true,
      buttonText: "Escolher Plano ",
    },
    {
      name: " Platinum ",
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
      popular: false,
      buttonText: "Escolher Plano",
    },
    {
      name: "Master Black ",
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
      popular: false,
      buttonText: "Escolher Plano",
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            ESCOLHA O PLANO
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              {" "}
              PERFEITO PARA SUA OPERAÇÃO
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto text-balance">
            Transforme sua estratégia de marketing com nossas soluções de copywriting alimentadas por IA
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all duration-300 flex flex-col h-full ${
                plan.popular ? "ring-2 ring-orange-500 scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-black px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star size={14} fill="currentColor" />
                    Mais Popular
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <CardDescription className="text-gray-400 mt-2">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full py-3 mt-auto ${
                    plan.popular
                      ? "bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-black font-semibold"
                      : "bg-gray-800 hover:bg-gray-700 text-white"
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">
            Todos os planos incluem teste gratuito de 7 dias. Cancele a qualquer momento.
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <span>✓ Suporte no whatsapp </span>
            <span>✓ Garantia de 7 dias</span>
            <span>✓ Pagamento seguro</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
