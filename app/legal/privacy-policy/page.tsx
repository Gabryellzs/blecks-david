import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Política de Privacidade do Bleck&apos;s</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Introdução</h2>
            <p>
              A sua privacidade é de extrema importância para nós do Bleck&apos;s. Esta Política de Privacidade descreve
              como coletamos, usamos, processamos e protegemos suas informações pessoais ao utilizar nossa plataforma.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. Informações Coletadas</h2>
            <p>
              Coletamos informações para fornecer e melhorar nossos serviços a você. As categorias de informações que
              coletamos incluem:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Informações de Cadastro:</strong> Nome, endereço de e-mail, informações de contato e credenciais
                de login.
              </li>
              <li>
                <strong>Dados de Uso:</strong> Informações sobre como você interage com a plataforma, como recursos
                acessados, tempo de uso e preferências.
              </li>
              <li>
                <strong>Dados Financeiros:</strong> Informações de transações de gateways de pagamento (valor, status,
                produto, etc.), mas não armazenamos dados sensíveis de cartão de crédito.
              </li>
              <li>
                <strong>Dados de Integração:</strong> Tokens de acesso e informações de contas de serviços de terceiros
                (ex: Facebook Ads, gateways de pagamento) que você opta por integrar.
              </li>
              <li>
                <strong>Dados Técnicos:</strong> Endereço IP, tipo de navegador, sistema operacional, dados de cookies e
                informações de dispositivo.
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. Como Usamos Suas Informações</h2>
            <p>Utilizamos as informações coletadas para:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Fornecer, operar e manter nossos serviços.</li>
              <li>Melhorar, personalizar e expandir nossos serviços.</li>
              <li>Entender e analisar como você usa nossos serviços.</li>
              <li>Desenvolver novos produtos, serviços, recursos e funcionalidades.</li>
              <li>
                Comunicar-nos com você, diretamente ou através de um de nossos parceiros, para atendimento ao cliente,
                para fornecer atualizações e outras informações relacionadas ao serviço, e para fins de marketing e
                promoção.
              </li>
              <li>Processar suas transações e gerenciar seus pagamentos.</li>
              <li>Detectar e prevenir fraudes.</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Compartilhamento de Informações</h2>
            <p>Não vendemos suas informações pessoais. Podemos compartilhar suas informações com:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Provedores de Serviço:</strong> Terceiros que nos ajudam a operar a plataforma (hospedagem,
                análise de dados, processamento de pagamentos).
              </li>
              <li>
                <strong>Parceiros de Negócios:</strong> Com seu consentimento, para oferecer produtos ou serviços que
                possam ser do seu interesse.
              </li>
              <li>
                <strong>Requisitos Legais:</strong> Se exigido por lei ou em resposta a processos legais válidos.
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Segurança dos Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações pessoais
              contra acesso não autorizado, alteração, divulgação ou destruição. No entanto, nenhum método de
              transmissão pela Internet ou armazenamento eletrônico é 100% seguro.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">6. Seus Direitos de Privacidade</h2>
            <p>Você tem o direito de:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Acessar e solicitar uma cópia de suas informações pessoais.</li>
              <li>Solicitar a correção de informações imprecisas.</li>
              <li>Solicitar a exclusão de suas informações pessoais, sujeito a certas exceções legais.</li>
              <li>Opor-se ao processamento de suas informações pessoais.</li>
            </ul>
            <p>Para exercer esses direitos, entre em contato conosco através dos canais de suporte.</p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">7. Cookies e Tecnologias Semelhantes</h2>
            <p>
              Utilizamos cookies e tecnologias de rastreamento semelhantes para monitorar a atividade em nosso serviço e
              armazenar certas informações. Você pode configurar seu navegador para recusar todos os cookies ou para
              indicar quando um cookie está sendo enviado.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">8. Alterações a Esta Política de Privacidade</h2>
            <p>
              Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre quaisquer
              alterações publicando a nova Política de Privacidade nesta página. Aconselhamos que você revise esta
              Política de Privacidade periodicamente para quaisquer alterações.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">9. Contato</h2>
            <p>
              Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco através do
              suporte na plataforma.
            </p>
          </section>

          <p className="text-sm text-center mt-8">Última atualização: 03 de Julho de 2025</p>
        </CardContent>
      </Card>
    </div>
  )
}
