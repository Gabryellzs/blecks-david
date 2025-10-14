export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2">
              <img src="/bless-footer-logo.png" alt="Bless" className="h-16 w-auto opacity-90" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Uma plataforma que transforma a maneira como você trabalha. Simples, poderosa e confiável.
            </p>
            <div className="flex space-x-4">
              <a href="mailto:blecks.com.br@gmail.com" className="hover:opacity-80 transition-opacity" aria-label="Email">
                <img src="/icons/gmail-icon.png" alt="Gmail" className="h-7 w-7" />
              </a>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                aria-label="WhatsApp"
              >
                <img src="/icons/whatsapp-icon.png" alt="WhatsApp" className="h-7 w-7" />
              </a>
              <a
                href="https://instagram.com/blecks.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                aria-label="Instagram"
              >
                <img src="/icons/instagram-icon.png" alt="Instagram" className="h-7 w-7" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-card-foreground mb-4">Produto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-card-foreground transition-colors">
                  Recursos
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-card-foreground transition-colors">
                  Preços
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-card-foreground transition-colors">
                  Integrações
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-card-foreground transition-colors">
                  API
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-card-foreground mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-card-foreground transition-colors">
                  Sobre
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-card-foreground transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-card-foreground transition-colors">
                  Carreiras
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-card-foreground transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-card-foreground mb-4">Políticas e Termos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-card-foreground transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-card-foreground transition-colors">
                  Política de Privacidade
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 md:mt-12 pt-6 md:pt-8 text-center">
          <p className="text-muted-foreground text-sm">© 2025 BLECK's Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
