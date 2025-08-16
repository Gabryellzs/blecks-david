import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function TermsOfUsePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Termos de Uso do Bleck&apos;s</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar os serviços do Bleck&apos;s, você concorda em cumprir e estar vinculado a estes
              Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos
              serviços.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. Descrição do Serviço</h2>
            <p>
              O Bleck&apos;s é uma plataforma de produtividade e gestão que oferece ferramentas para otimizar suas
              tarefas diárias, gerenciar finanças, acompanhar vendas de gateways de pagamento, gerenciar campanhas de
              anúncios e muito mais. Nossos serviços são fornecidos &quot;como estão&quot; e &quot;conforme
              disponíveis&quot;.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. Cadastro e Conta</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Você deve ter pelo menos 18 anos para utilizar nossos serviços.</li>
              <li>Você é responsável por manter a confidencialidade de suas informações de login.</li>
              <li>Você concorda em fornecer informações precisas e completas durante o processo de registro.</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Uso Proibido</h2>
            <p>Você concorda em não utilizar o Bleck&apos;s para:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Atividades ilegais ou fraudulentas.</li>
              <li>Violar direitos de propriedade intelectual de terceiros.</li>
              <li>Distribuir malware ou conteúdo prejudicial.</li>
              <li>Interferir na operação normal da plataforma.</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo e software da plataforma Bleck&apos;s são de propriedade exclusiva do Bleck&apos;s ou de
              seus licenciadores e são protegidos por leis de direitos autorais e outras leis de propriedade
              intelectual.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">6. Limitação de Responsabilidade</h2>
            <p>
              O Bleck&apos;s não será responsável por quaisquer danos diretos, indiretos, incidentais, especiais ou
              consequenciais resultantes do uso ou da incapacidade de usar nossos serviços.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">7. Modificações dos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. As modificações entrarão em
              vigor imediatamente após a publicação na plataforma. Seu uso continuado dos serviços após as modificações
              constitui sua aceitação dos novos termos.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">8. Rescisão</h2>
            <p>
              Podemos rescindir ou suspender seu acesso aos nossos serviços imediatamente, sem aviso prévio ou
              responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar os Termos.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">9. Lei Aplicável</h2>
            <p>
              Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, sem considerar seus conflitos
              de disposições legais.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">10. Contato</h2>
            <p>
              Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco através do suporte na
              plataforma.
            </p>
          </section>

          <p className="text-sm text-center mt-8">Última atualização: 03 de Julho de 2025</p>
        </CardContent>
      </Card>
    </div>
  )
}
