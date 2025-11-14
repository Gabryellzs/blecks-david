"use client"

import React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "O que é o BLECK'S?",
    answer:
      "BLECK'S é uma plataforma completa de automação e gestão de operações que permite você dominar cada detalhe do seu negócio. Com análise de faturamento em tempo real, diário semanal automatizado, calendário inteligente e IA's integradas, você escala sua operação com total precisão.",
  },
  {
    question: "Como funciona o teste grátis de 7 dias?",
    answer:
      "Você pode testar todas as funcionalidades do BLECK'S gratuitamente por 7 dias, sem necessidade de cartão de crédito. Durante o período de teste, você terá acesso completo a todas as ferramentas, integrações e recursos da plataforma para avaliar como ela pode transformar seu negócio.",
  },
  {
    question: "Quais integrações estão disponíveis?",
    answer:
      "BLECK'S integra com as melhores plataformas do mercado, incluindo Meta Ads, Google Ads, Google Analytics, TikTok Ads, Kwai Ads, e diversas outras ferramentas essenciais para gestão e automação do seu negócio. Novas integrações são adicionadas regularmente.",
  },
  {
    question: "Como funciona a análise de faturamento?",
    answer:
      "Nossa análise de faturamento oferece insights em tempo real sobre a performance financeira do seu negócio. Você visualiza métricas detalhadas, gráficos interativos e relatórios automatizados que ajudam a tomar decisões estratégicas baseadas em dados concretos.",
  },
  {
    question: "O que são as IA's integradas?",
    answer:
      "As IA's do BLECK'S são assistentes inteligentes que automatizam tarefas repetitivas, analisam dados complexos, geram insights preditivos e otimizam processos. Elas aprendem com seu negócio e fornecem recomendações personalizadas para aumentar sua produtividade e resultados.",
  },
  {
    question: "Como funciona o suporte?",
    answer:
      "Oferecemos suporte completo através de múltiplos canais: chat ao vivo, email e base de conhecimento. Nossa equipe está disponível para ajudar você a aproveitar ao máximo todas as funcionalidades da plataforma e resolver qualquer dúvida rapidamente.",
  },
  {
    question: "Quais são os planos disponíveis?",
    answer:
      "Temos planos flexíveis que se adaptam ao tamanho e necessidades do seu negócio. Desde pequenas operações até grandes empresas, oferecemos opções escaláveis com diferentes níveis de recursos e integrações. Acesse a página de Assinaturas para conhecer todos os detalhes.",
  },
  {
    question: "Meus dados estão seguros?",
    answer:
      "Sim! A segurança dos seus dados é nossa prioridade máxima. Utilizamos criptografia de ponta a ponta, servidores seguros e seguimos as melhores práticas de segurança da informação. Seus dados são armazenados com total privacidade e conformidade com a LGPD.",
  },
]

export const FAQSection = React.memo(function FAQSection() {
  return (
    <section className="relative py-12 md:py-16 bg-black overflow-hidden">
      {/* Glow metálico suave no topo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(180,180,180,0.12),rgba(0,0,0,0)_70%)] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 max-w-4xl relative z-10">
        {/* Título */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ficou com alguma dúvida?
          </h2>
          <p className="text-gray-400 text-lg mt-3">
            Confira as perguntas mais frequentes abaixo:
          </p>
        </div>

        {/* FAQ */}
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className={`
                border border-gray-700/40 
                rounded-xl 
                px-5 py-1
                bg-black/40 
                backdrop-blur-sm 
                shadow-[0_0_18px_rgba(255,255,255,0.03)]
                hover:shadow-[0_0_26px_rgba(255,255,255,0.06)]
                transition-all duration-300
                ${index === faqs.length - 1 ? "mb-4 border-b-gray-600/60" : ""}
              `}
            >
              <AccordionTrigger className="text-left text-white text-lg font-semibold hover:text-gray-300 transition-colors">
                {faq.question}
              </AccordionTrigger>

              <AccordionContent className="text-gray-400 text-base leading-relaxed pb-3">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-100 mb-3">Ainda tem dúvidas?</p>

          <a
            href="#"
            className="
              relative inline-flex items-center justify-center
              rounded-2xl p-[1px]
              bg-gradient-to-r from-zinc-300/80 via-zinc-600/40 to-zinc-300/80
              shadow-[0_0_22px_rgba(200,200,200,0.35)]
              hover:shadow-[0_0_40px_rgba(220,220,220,0.6)]
              transition-all duration-300
            "
          >
            {/* Glow suave pulsando */}
            <span
              aria-hidden="true"
              className="
                pointer-events-none absolute inset-0 rounded-2xl
                bg-white/10 blur-xl opacity-25
                animate-pulse
              "
            />

            {/* Conteúdo do botão */}
            <span
              className="
                relative inline-flex items-center justify-center
                px-8 py-3 rounded-[1rem]
                bg-gradient-to-b from-black via-black/90 to-neutral-950
                text-white text-lg tracking-wide font-semibold
              "
            >
              Falar com o suporte
            </span>
          </a>
        </div>
      </div>
    </section>
  )
})
