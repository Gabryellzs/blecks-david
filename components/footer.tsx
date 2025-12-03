export function Footer() {
  return (
    <footer className="relative bg-black/95 border-t border-white/10 backdrop-blur-xl overflow-hidden">
      {/* ——— LUZES DISCRETAS E LUXUOSAS ——— */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-300/10 via-zinc-700/5 to-transparent" />
      <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl opacity-10" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 bg-zinc-400/10 blur-3xl opacity-10" />

      <div className="container mx-auto px-4 py-10 md:py-14 relative z-10">
        {/* ——— GRID PRINCIPAL ——— */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* ——— LOGO + TEXTO + SOCIAIS ——— */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2">
              <img
                src="/bless-footer-logo.png"
                alt="Bless"
                className="h-16 w-auto opacity-90"
              />
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed">
              Uma plataforma que transforma a maneira como você trabalha.
              Simples, poderosa e confiável.
            </p>

            {/* Ícones sociais */}
            <div className="flex space-x-4 pt-2">
              {/* EMAIL */}
              <a
                href="mailto:blecks.com.br@gmail.com"
                aria-label="Email"
                className="group"
              >
                <div className="p-[1px] rounded-full bg-gradient-to-br from-zinc-300/30 via-zinc-600/20 to-transparent group-hover:from-zinc-400/40 transition">
                  <div className="bg-black/40 backdrop-blur-lg rounded-full p-2 border border-white/10 group-hover:border-white/20 transition">
                    <img
                      src="/iconss.sociais/gmail-icon.png"
                      className="h-5 w-5 opacity-80"
                    />
                  </div>
                </div>
              </a>

              {/* WHATSAPP */}
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="group"
              >
                <div className="p-[1px] rounded-full bg-gradient-to-br from-zinc-300/30 via-zinc-600/20 to-transparent group-hover:from-zinc-400/40 transition">
                  <div className="bg-black/40 backdrop-blur-lg rounded-full p-2 border border-white/10 group-hover:border-white/20 transition">
                    <img
                      src="/iconss.sociais/whatsapp-icon.png"
                      className="h-5 w-5 opacity-80"
                    />
                  </div>
                </div>
              </a>

              {/* INSTAGRAM */}
              <a
                href="https://instagram.com/blecks.combr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="group"
              >
                <div className="p-[1px] rounded-full bg-gradient-to-br from-zinc-300/30 via-zinc-600/20 to-transparent group-hover:from-zinc-400/40 transition">
                  <div className="bg-black/40 backdrop-blur-lg rounded-full p-2 border border-white/10 group-hover:border-white/20 transition">
                    <img
                      src="/iconss.sociais/instagram-icon.png"
                      className="h-5 w-5 opacity-80"
                    />
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* ——— COLUNA: PRODUTO ——— */}
          <FooterColumn
            title="Produto"
            items={["Recursos", "Preços", "Integrações", "API"]}
          />

          {/* ——— COLUNA: EMPRESA ——— */}
          <FooterColumn
            title="Empresa"
            items={["Sobre", "Blog", "Carreiras", "Contato"]}
          />

          {/* ——— COLUNA: POLÍTICAS (ESCRITA NA MÃO) ——— */}
          <div>
            <h3 className="font-semibold text-zinc-200 mb-4 tracking-wide">
              Políticas e Termos
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.blacksproductivity.site/legal/terms-of-use"
                  className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Termos de Uso
                </a>
              </li>
              <li>
                <a
                  href="https://www.blacksproductivity.site/legal/privacy-policy"
                  className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Política de Privacidade
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ——— COPYRIGHT ——— */}
        <div className="border-t border-white/10 mt-12 pt-6 text-center">
          <p className="text-zinc-500 text-xs md:text-sm tracking-wide">
            © 2025 BLECK&apos;s — Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold text-zinc-200 mb-4 tracking-wide">
        {title}
      </h3>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item}>
            <a
              href="#"
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
