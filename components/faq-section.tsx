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
    <section className="py-16 md:py-20 lg:py-24 bg-black">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        {/* Título */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Ficou com alguma dúvida?</h2>
          <p className="text-lg md:text-xl text-gray-400">Dê uma olhada nas perguntas mais frequentes abaixo:</p>
        </div>

        {/* Accordion de perguntas */}
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-gray-800 rounded-lg px-6 bg-gray-900/30 backdrop-blur-sm hover:bg-gray-900/50 transition-colors"
            >
              <AccordionTrigger className="text-left text-white hover:text-gray-300 text-base md:text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 text-sm md:text-base leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* CTA adicional */}
        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">Ainda tem dúvidas?</p>
          <a
            href="#"
            className="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
          >
            Entre em contato conosco
          </a>
        </div>
      </div>
    </section>
  )
})
