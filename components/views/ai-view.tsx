export default function AIView() {
  return (
    <div className="w-full min-h-screen px-4 py-6">
      <h1 className="text-4xl font-bold mb-8 text-center">IA's por Categoria</h1>

      <div className="mx-auto max-w-[1800px] grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 justify-items-center">
        {/* PESQUISA */}
        <div className="bg-background border-2 border-dashed border-primary/50 p-6 rounded-[15px] w-full max-w-xs shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="bg-primary rounded-[10px] p-[5px_10px] text-[18px] mt-0 mb-4 text-center text-primary-foreground font-bold shadow-md">
            PESQUISA
          </h2>
          <a
            href="https://deepseek.com"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            DeepSeek R1
          </a>
          <a
            href="https://www.perplexity.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Perplexity
          </a>
          <a
            href="https://chat.openai.com"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            ChatGPT
          </a>
          <a
            href="https://claude.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Claude
          </a>
          <a
            href="https://deepmind.google/technologies/gemini/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Gemini
          </a>
        </div>

        {/* MARKETING */}
        <div className="bg-background border-2 border-dashed border-primary/50 p-6 rounded-[15px] w-full max-w-xs shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="bg-primary rounded-[10px] p-[5px_10px] text-[18px] mt-0 mb-4 text-center text-primary-foreground font-bold shadow-md">
            MARKETING
          </h2>
          <a
            href="https://www.pencil.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Pencil
          </a>
          <a
            href="https://adcopy.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            AdCopy
          </a>
          <a
            href="https://simplified.com"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Simplified
          </a>
        </div>

        {/* PRODUTIVIDADE */}
        <div className="bg-background border-2 border-dashed border-primary/50 p-6 rounded-[15px] w-full max-w-xs shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="bg-primary rounded-[10px] p-[5px_10px] text-[18px] mt-0 mb-4 text-center text-primary-foreground font-bold shadow-md">
            PRODUTIVIDADE
          </h2>
          <a
            href="https://www.decktopus.com"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Decktopus
          </a>
          <a
            href="https://grok.x.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Grok 3
          </a>
          <a
            href="https://betterpic.io"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            BetterPic
          </a>
          <a
            href="https://chat.openai.com"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            ChatGPT
          </a>
          <a
            href="https://www.taskade.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Taskade
          </a>
          <a
            href="https://tana.inc/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Tana
          </a>
          <a
            href="https://www.usemotion.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Motion
          </a>
          <a
            href="https://www.supernormal.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Supernormal
          </a>
        </div>

        {/* SITE */}
        <div className="bg-background border-2 border-dashed border-primary/50 p-6 rounded-[15px] w-full max-w-xs shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="bg-primary rounded-[10px] p-[5px_10px] text-[18px] mt-0 mb-4 text-center text-primary-foreground font-bold shadow-md">
            SITE
          </h2>
          <a
            href="https://www.dora.run"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Dora
          </a>
          <a
            href="https://10web.io"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            10Web
          </a>
          <a
            href="https://durable.co"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Durable
          </a>
          <a
            href="https://landingsite.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Landingsite
          </a>
          <a
            href="https://www.viz.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Viz
          </a>
        </div>

        {/* DESIGN */}
        <div className="bg-background border-2 border-dashed border-primary/50 p-6 rounded-[15px] w-full max-w-xs shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="bg-primary rounded-[10px] p-[5px_10px] text-[18px] mt-0 mb-4 text-center text-primary-foreground font-bold shadow-md">
            DESIGN
          </h2>
          <a
            href="https://leonardo.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Leonardo AI
          </a>
          <a
            href="https://www.kittl.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Kittl
          </a>
          <a
            href="https://looka.com"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Looka
          </a>
          <a
            href="https://www.canva.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Canva
          </a>
          <a
            href="https://designs.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Designs AI
          </a>
        </div>

        {/* CHATBOT */}
        <div className="bg-background border-2 border-dashed border-primary/50 p-6 rounded-[15px] w-full max-w-xs shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="bg-primary rounded-[10px] p-[5px_10px] text-[18px] mt-0 mb-4 text-center text-primary-foreground font-bold shadow-md">
            CHATBOT
          </h2>
          <a
            href="https://trycortex.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Trycortex
          </a>
          <a
            href="https://chatfuel.com"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Chatfuel
          </a>
          <a
            href="https://dante-ai.com"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Dante AI
          </a>
          <a
            href="https://droxy.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Droxy
          </a>
          <a
            href="https://sitegpt.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            SiteGPT
          </a>
        </div>

        {/* REUNIÃO */}
        <div className="bg-background border-2 border-dashed border-primary/50 p-6 rounded-[15px] w-full max-w-xs shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="bg-primary rounded-[10px] p-[5px_10px] text-[18px] mt-0 mb-4 text-center text-primary-foreground font-bold shadow-md">
            REUNIÃO
          </h2>
          <a
            href="https://www.kickresume.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Kickresume
          </a>
          <a
            href="https://resume.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Resume AI
          </a>
          <a
            href="https://www.tealhq.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Teal
          </a>
          <a
            href="https://www.careerflow.ai/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Careerflow
          </a>
        </div>

        {/* ÁUDIO */}
        <div className="bg-background border-2 border-dashed border-primary/50 p-6 rounded-[15px] w-full max-w-xs shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="bg-primary rounded-[10px] p-[5px_10px] text-[18px] mt-0 mb-4 text-center text-primary-foreground font-bold shadow-md">
            ÁUDIO
          </h2>
          <a
            href="https://www.elevenlabs.io/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Eleven Labs
          </a>
          <a
            href="https://songburst.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Songburst AI
          </a>
          <a
            href="https://podcast.adobe.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Adobe Podcast
          </a>
          <a
            href="https://www.lovo.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Lovo AI
          </a>
        </div>

        {/* GERADORES DE IMAGENS */}
        <div className="bg-background border-2 border-dashed border-primary/50 p-6 rounded-[15px] w-full max-w-xs shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="bg-primary rounded-[10px] p-[5px_10px] text-[18px] mt-0 mb-4 text-center text-primary-foreground font-bold shadow-md">
            GERADORES DE IMAGENS
          </h2>
          <a
            href="https://www.midjourney.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Midjourney
          </a>
          <a
            href="https://openai.com/dall-e"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            DALL·E 3
          </a>
          <a
            href="https://dreamstudio.ai/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Stable Diffusion
          </a>
          <a
            href="https://leonardo.ai"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Leonardo.Ai
          </a>
          <a
            href="https://firefly.adobe.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Adobe Firefly
          </a>
          <a
            href="https://www.craiyon.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Craiyon
          </a>
          <a
            href="https://creator.nightcafe.studio/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            NightCafe
          </a>
          <a
            href="https://runwayml.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Runway ML
          </a>
          <a
            href="https://www.artbreeder.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Artbreeder
          </a>
          <a
            href="https://dream.ai/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Dream by Wombo
          </a>
        </div>

        {/* VÍDEO */}
        <div className="bg-background border-2 border-dashed border-primary/50 p-6 rounded-[15px] w-full max-w-xs shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="bg-primary rounded-[10px] p-[5px_10px] text-[18px] mt-0 mb-4 text-center text-primary-foreground font-bold shadow-md">
            VÍDEO
          </h2>
          <a
            href="https://klap.app"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Klap
          </a>
          <a
            href="https://invideo.io/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            InVideo
          </a>
          <a
            href="https://www.opus.pro"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Opus Clip
          </a>
          <a
            href="https://www.heygen.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            HeyGen
          </a>
          <a
            href="https://eightify.app"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Eightify
          </a>
        </div>

        {/* GERADOR DE LOGO */}
        <div className="bg-background border-2 border-dashed border-primary/50 p-6 rounded-[15px] w-full max-w-xs shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="bg-primary rounded-[10px] p-[5px_10px] text-[18px] mt-0 mb-4 text-center text-primary-foreground font-bold shadow-md">
            GERADOR DE LOGO
          </h2>
          <a
            href="https://namelix.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Namelix
          </a>
          <a
            href="https://designs.ai/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Designs AI
          </a>
          <a
            href="https://brandmark.io/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Brandmark
          </a>
          <a
            href="https://stockimg.ai/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Stockimg AI
          </a>
        </div>

        {/* UI/UX */}
        <div className="bg-background border-2 border-dashed border-primary/50 p-6 rounded-[15px] w-full max-w-xs shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="bg-primary rounded-[10px] p-[5px_10px] text-[18px] mt-0 mb-4 text-center text-primary-foreground font-bold shadow-md">
            UI/UX
          </h2>
          <a
            href="https://uizard.io/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Uizard
          </a>
          <a
            href="https://www.galileo-ai.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Galileo AI
          </a>
          <a
            href="https://www.visily.ai/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Visily
          </a>
          <a
            href="https://magician.design/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Magician
          </a>
        </div>

        {/* AUTOMAÇÃO */}
        <div className="bg-background border-2 border-dashed border-primary/50 p-6 rounded-[15px] w-full max-w-xs shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="bg-primary rounded-[10px] p-[5px_10px] text-[18px] mt-0 mb-4 text-center text-primary-foreground font-bold shadow-md">
            AUTOMAÇÃO
          </h2>
          <a
            href="https://zapier.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Zapier
          </a>
          <a
            href="https://ifttt.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            IFTTT
          </a>
          <a
            href="https://www.make.com/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Make
          </a>
          <a
            href="https://www.bardeen.ai/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Bardeen
          </a>
          <a
            href="https://axiom.ai/"
            target="_blank"
            className="block text-foreground no-underline my-[10px] pl-[15px] relative hover:text-primary before:content-['\'] before:absolute before:left-0 before:text-[10px] transition-colors duration-200"
            rel="noreferrer"
          >
            Axiom
          </a>
        </div>
      </div>
    </div>
  )
}
