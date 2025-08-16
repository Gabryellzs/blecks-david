"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Share2, Copy, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FavoriteButton } from "@/components/ui/favorite-button"

// Importe o hook useLocalStorage
import { useLocalStorage } from "@/hooks/use-local-storage"

// Lista de frases motivacionais fortes
const MOTIVATIONAL_QUOTES = [
  "O sucesso não é final, o fracasso não é fatal: é a coragem de continuar que conta.",
  "A única maneira de fazer um excelente trabalho é amar o que você faz.",
  "Não importa o quão devagar você vá, desde que você não pare.",
  "Acredite que você pode, assim você já está no meio do caminho.",
  "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
  "Não tenha medo de desistir do bom para perseguir o ótimo.",
  "A persistência é o caminho do êxito.",
  "Você é mais forte do que pensa e será mais bem-sucedido do que imagina.",
  "Não espere por oportunidades, crie você mesmo as suas.",
  "Sua única limitação é aquela que você impõe em sua própria mente.",
  "O pessimista vê dificuldade em cada oportunidade. O otimista vê oportunidade em cada dificuldade.",
  "Não é sobre ter tempo, é sobre fazer tempo.",
  "Seja a mudança que você deseja ver no mundo.",
  "Quanto maior a dificuldade, maior a glória.",
  "Não conte os dias, faça os dias contarem.",
  "O que você faz hoje pode melhorar todos os seus amanhãs.",
  "Nunca é tarde demais para ser o que você poderia ter sido.",
  "Comece onde você está. Use o que você tem. Faça o que você pode.",
  "Quando você quer alguma coisa, todo o universo conspira para que você realize seu desejo.",
  "Você não é derrotado quando perde, você é derrotado quando desiste.",
  // Novas frases motivacionais
  "A disciplina é a ponte entre metas e realizações.",
  "Grandes mentes discutem ideias; mentes medianas discutem eventos; mentes pequenas discutem pessoas.",
  "Não é o mais forte que sobrevive, nem o mais inteligente, mas o que melhor se adapta às mudanças.",
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "Não espere por circunstâncias ideais. Crie-as.",
  "A maior glória não está em nunca cair, mas em se levantar cada vez que caímos.",
  "Sua atitude, não sua aptidão, determinará sua altitude.",
  "O único modo de fazer um excelente trabalho é amar o que você faz.",
  "Não tenha medo de desistir do bom para perseguir o ótimo.",
  "A vida começa no fim da sua zona de conforto.",
  "Sonhe grande. Comece pequeno. Mas comece.",
  "Sua rede determina seu valor líquido.",
  "Não há elevador para o sucesso. Você tem que subir as escadas.",
  "Você não pode mudar o vento, mas pode ajustar as velas do barco para chegar onde quer.",
  "Pessoas de sucesso fazem o que pessoas mal sucedidas não estão dispostas a fazer.",
  "Não é sobre ter tempo, é sobre fazer tempo.",
  "Você é a média das cinco pessoas com quem passa mais tempo.",
  "Falhar em planejar é planejar para falhar.",
  "A melhor maneira de prever o futuro é criá-lo.",
  "Não espere. O tempo nunca será o ideal.",
]

// Lista de frases bíblicas motivacionais
const BIBLICAL_QUOTES = [
  "Tudo posso naquele que me fortalece. (Filipenses 4:13)",
  "O Senhor é a minha força e o meu escudo; nele o meu coração confia, e dele recebo ajuda. (Salmos 28:7)",
  "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça. (Isaías 41:10)",
  "Mas os que esperam no Senhor renovarão as forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão. (Isaías 40:31)",
  "Porque Deus não nos deu espírito de covardia, mas de poder, de amor e de moderação. (2 Timóteo 1:7)",
  "Sejam fortes e corajosos. Não tenham medo nem fiquem apavorados por causa delas, pois o Senhor, o seu Deus, vai com vocês; nunca os deixará, nunca os abandonará. (Deuteronômio 31:6)",
  "O Senhor é o meu pastor, nada me faltará. (Salmos 23:1)",
  "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará. (Salmos 37:5)",
  "Porque eu bem sei os planos que tenho a vosso respeito, diz o Senhor; planos de paz, e não de mal, para vos dar um futuro e uma esperança. (Jeremias 29:11)",
  "Deleita-te também no Senhor, e ele te concederá os desejos do teu coração. (Salmos 37:4)",
  "Não se amoldem ao padrão deste mundo, mas transformem-se pela renovação da sua mente, para que sejam capazes de experimentar e comprovar a boa, agradável e perfeita vontade de Deus. (Romanos 12:2)",
  "Portanto, meus amados irmãos, sede firmes e constantes, sempre abundantes na obra do Senhor, sabendo que o vosso trabalho não é vão no Senhor. (1 Coríntios 15:58)",
  "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento. (Provérbios 3:5)",
  "Eu disse essas coisas para que em mim vocês tenham paz. Neste mundo vocês terão aflições; contudo, tenham ânimo! Eu venci o mundo. (João 16:33)",
  "Não fui eu que ordenei a você? Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar. (Josué 1:9)",
  // Novas frases bíblicas
  "Lança o teu fardo sobre o Senhor, e ele te sustentará; jamais permitirá que o justo seja abalado. (Salmos 55:22)",
  "Porque o Senhor Deus é sol e escudo; o Senhor concede graça e glória; não recusa nenhum bem aos que andam retamente. (Salmos 84:11)",
  "Não vos inquieteis, pois, pelo dia de amanhã, porque o dia de amanhã cuidará de si mesmo. Basta a cada dia o seu mal. (Mateus 6:34)",
  "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei. (Mateus 11:28)",
  "Porque o Senhor é bom, a sua misericórdia dura para sempre, e a sua fidelidade, de geração em geração. (Salmos 100:5)",
  "Ele te declarou, ó homem, o que é bom; e que é o que o Senhor pede de ti, senão que pratiques a justiça, e ames a misericórdia, e andes humildemente com o teu Deus? (Miquéias 6:8)",
  "Não andeis ansiosos por coisa alguma; antes em tudo sejam os vossos pedidos conhecidos diante de Deus pela oração e súplica com ações de graças. (Filipenses 4:6)",
  "Bem-aventurado o homem que não anda segundo o conselho dos ímpios, nem se detém no caminho dos pecadores, nem se assenta na roda dos escarnecedores. (Salmos 1:1)",
  "Porque o salário do pecado é a morte, mas o dom gratuito de Deus é a vida eterna em Cristo Jesus, nosso Senhor. (Romanos 6:23)",
  "Buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas. (Mateus 6:33)",
  "Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus. (Efésios 2:8)",
  "Ora, a fé é a certeza de coisas que se esperam, a convicção de fatos que se não veem. (Hebreus 11:1)",
  "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna. (João 3:16)",
  "Não to mandei eu? Sê forte e corajoso; não temas, nem te espantes, porque o Senhor, teu Deus, é contigo por onde quer que andares. (Josué 1:9)",
  "Mas buscai primeiro o reino de Deus, e a sua justiça, e todas essas coisas vos serão acrescentadas. (Mateus 6:33)",
]

// Nova categoria: Frases de Empreendedorismo
const ENTREPRENEURSHIP_QUOTES = [
  "O risco de não arriscar é muito maior do que o risco de arriscar.",
  "Empreendedores são aqueles que entendem que há uma pequena diferença entre um obstáculo e uma oportunidade e são capazes de transformar ambos em vantagem.",
  "Se você não está disposto a arriscar o comum, você terá que se contentar com o ordinário.",
  "O sucesso normalmente vem para quem está ocupado demais para procurar por ele.",
  "Se você realmente quer algo, não espere. Ensine a si mesmo as habilidades que você precisa para consegui-lo.",
  "Não tenha medo de desistir do bom para perseguir o ótimo.",
  "O fracasso é simplesmente a oportunidade de começar de novo, desta vez de forma mais inteligente.",
  "Não importa quantas vezes você falha. Você só precisa estar certo uma vez.",
  "O melhor momento para plantar uma árvore foi há 20 anos. O segundo melhor momento é agora.",
  "Seu cliente mais insatisfeito é sua maior fonte de aprendizado.",
  "Se você não pode fazer grandes coisas, faça pequenas coisas de maneira grandiosa.",
  "O segredo do sucesso é começar de onde você está, com o que você tem.",
  "Não encontre clientes para seus produtos, encontre produtos para seus clientes.",
  "A melhor maneira de prever o futuro é criá-lo.",
  "Não é sobre ideias. É sobre fazer as ideias acontecerem.",
  "Se você não está envergonhado com a primeira versão do seu produto, você lançou tarde demais.",
  "Faça o que você pode, com o que você tem, onde você está.",
  "O sucesso não é a chave para a felicidade. A felicidade é a chave para o sucesso.",
  "Não é o empregador que paga os salários. Os empregadores apenas lidam com o dinheiro. É o cliente que paga os salários.",
  "A persistência é o caminho do êxito.",
]

// Nova categoria: Frases de Desenvolvimento Pessoal
const PERSONAL_DEVELOPMENT_QUOTES = [
  "Invista em você mesmo. Seu futuro depende disso.",
  "A única pessoa que você deve tentar superar é a pessoa que você era ontem.",
  "Sua vida só melhora quando você melhora.",
  "O conhecimento não é poder. A aplicação do conhecimento é poder.",
  "Você não pode voltar atrás e mudar o começo, mas pode começar onde está e mudar o final.",
  "Não é o que acontece com você, mas como você reage ao que acontece que importa.",
  "A mudança é difícil no começo, confusa no meio e linda no final.",
  "Você é a média das cinco pessoas com quem passa mais tempo.",
  "Não espere por oportunidades, crie-as.",
  "Sua atitude, não sua aptidão, determinará sua altitude.",
  "O maior obstáculo para o sucesso é o medo do fracasso.",
  "Você não pode mudar seu destino da noite para o dia, mas pode mudar sua direção.",
  "Não tenha medo de desistir do bom para perseguir o ótimo.",
  "A disciplina é a ponte entre metas e realizações.",
  "Sua zona de conforto é um lugar bonito, mas nada cresce lá.",
  "Não compare sua vida com a dos outros. Não há comparação entre o sol e a lua. Eles brilham quando é sua vez.",
  "Você não precisa ser grande para começar, mas precisa começar para ser grande.",
  "A vida começa no fim da sua zona de conforto.",
  "Não é sobre ter tempo, é sobre fazer tempo.",
  "Seja a mudança que você deseja ver no mundo.",
]

// Nova categoria: Frases de Produtividade
const PRODUCTIVITY_QUOTES = [
  "Não confunda movimento com progresso.",
  "Produtividade não é fazer mais coisas, é fazer as coisas certas.",
  "Foco é dizer não para mil coisas boas para poder dizer sim para algumas ótimas.",
  "A procrastinação é como um cartão de crédito: é muito divertido até você receber a conta.",
  "Não espere por inspiração. Ela vem trabalhando.",
  "Você não precisa ser grande para começar, mas precisa começar para ser grande.",
  "Não é sobre ter tempo, é sobre fazer tempo.",
  "A produtividade é nunca fazer acidentalmente o que você não quer fazer de propósito.",
  "Trabalhe mais inteligentemente, não mais arduamente.",
  "Não gerencie o tempo, gerencie a energia.",
  "Planeje seu trabalho, depois trabalhe seu plano.",
  "A produtividade é menos sobre o que você faz com seu tempo e mais sobre como você administra sua energia.",
  "Não confunda atividade com realização.",
  "Faça o trabalho mais importante primeiro, não o mais urgente.",
  "A multitarefa é uma mentira.",
  "Não é sobre fazer tudo. É sobre fazer o que importa.",
  "Produtividade é fazer menos, não mais.",
  "Comece com o fim em mente.",
  "Não espere pelo momento perfeito. Tome o momento e torne-o perfeito.",
  "A produtividade é ser capaz de fazer coisas que você nunca foi capaz de fazer antes.",
]

export default function DailyMessageView() {
  const [message, setMessage] = useState("")
  const [savedMessage, setSavedMessage] = useLocalStorage<string>("daily-message", "")
  const [lastUpdated, setLastUpdated] = useLocalStorage<string | null>("daily-message-updated", null)
  const [activeTab, setActiveTab] = useLocalStorage<string>("daily-message-active-tab", "motivational")
  const [copied, setCopied] = useState(false)

  // Estados para as frases de diferentes categorias
  const [motivationalQuote, setMotivationalQuote] = useLocalStorage<string>("daily-motivational-quote", "")
  const [biblicalQuote, setBiblicalQuote] = useLocalStorage<string>("daily-biblical-quote", "")
  const [entrepreneurshipQuote, setEntrepreneurshipQuote] = useLocalStorage<string>("daily-entrepreneurship-quote", "")
  const [personalDevQuote, setPersonalDevQuote] = useLocalStorage<string>("daily-personal-dev-quote", "")
  const [productivityQuote, setProductivityQuote] = useLocalStorage<string>("daily-productivity-quote", "")
  const [lastQuoteUpdate, setLastQuoteUpdate] = useLocalStorage<string | null>("daily-quote-updated", null)

  // Função para selecionar uma frase aleatória de um array
  const getRandomQuote = (quotes: string[]) => {
    const randomIndex = Math.floor(Math.random() * quotes.length)
    return quotes[randomIndex]
  }

  // Função para atualizar todas as frases
  const updateAllQuotes = () => {
    const newMotivationalQuote = getRandomQuote(MOTIVATIONAL_QUOTES)
    const newBiblicalQuote = getRandomQuote(BIBLICAL_QUOTES)
    const newEntrepreneurshipQuote = getRandomQuote(ENTREPRENEURSHIP_QUOTES)
    const newPersonalDevQuote = getRandomQuote(PERSONAL_DEVELOPMENT_QUOTES)
    const newProductivityQuote = getRandomQuote(PRODUCTIVITY_QUOTES)

    setMotivationalQuote(newMotivationalQuote)
    setBiblicalQuote(newBiblicalQuote)
    setEntrepreneurshipQuote(newEntrepreneurshipQuote)
    setPersonalDevQuote(newPersonalDevQuote)
    setProductivityQuote(newProductivityQuote)
    setLastQuoteUpdate(new Date().toLocaleString())

    // Atualizar no localStorage
    localStorage.setItem("daily-motivational-quote", JSON.stringify(newMotivationalQuote))
    localStorage.setItem("daily-biblical-quote", JSON.stringify(newBiblicalQuote))
    localStorage.setItem("daily-entrepreneurship-quote", JSON.stringify(newEntrepreneurshipQuote))
    localStorage.setItem("daily-personal-dev-quote", JSON.stringify(newPersonalDevQuote))
    localStorage.setItem("daily-productivity-quote", JSON.stringify(newProductivityQuote))
    localStorage.setItem("daily-quote-updated", JSON.stringify(new Date().toLocaleString()))

    toast({
      title: "Frases atualizadas",
      description: "Novas frases foram carregadas em todas as categorias.",
    })
  }

  // Função para atualizar apenas a frase da categoria ativa
  const updateActiveQuote = () => {
    let newQuote = ""

    switch (activeTab) {
      case "motivational":
        newQuote = getRandomQuote(MOTIVATIONAL_QUOTES)
        setMotivationalQuote(newQuote)
        localStorage.setItem("daily-motivational-quote", JSON.stringify(newQuote))
        break
      case "biblical":
        newQuote = getRandomQuote(BIBLICAL_QUOTES)
        setBiblicalQuote(newQuote)
        localStorage.setItem("daily-biblical-quote", JSON.stringify(newQuote))
        break
      case "entrepreneurship":
        newQuote = getRandomQuote(ENTREPRENEURSHIP_QUOTES)
        setEntrepreneurshipQuote(newQuote)
        localStorage.setItem("daily-entrepreneurship-quote", JSON.stringify(newQuote))
        break
      case "personal-dev":
        newQuote = getRandomQuote(PERSONAL_DEVELOPMENT_QUOTES)
        setPersonalDevQuote(newQuote)
        localStorage.setItem("daily-personal-dev-quote", JSON.stringify(newQuote))
        break
      case "productivity":
        newQuote = getRandomQuote(PRODUCTIVITY_QUOTES)
        setProductivityQuote(newQuote)
        localStorage.setItem("daily-productivity-quote", JSON.stringify(newQuote))
        break
    }

    setLastQuoteUpdate(new Date().toLocaleString())
    localStorage.setItem("daily-quote-updated", JSON.stringify(new Date().toLocaleString()))

    toast({
      title: "Frase atualizada",
      description: "Uma nova frase foi carregada para esta categoria.",
    })
  }

  // Carregar frases aleatórias quando o componente for montado
  useEffect(() => {
    // Função para verificar se as frases foram atualizadas hoje
    const checkIfShouldUpdate = () => {
      // Se não temos frases salvas, gerar novas
      if (!motivationalQuote || !biblicalQuote || !entrepreneurshipQuote || !personalDevQuote || !productivityQuote) {
        updateAllQuotes()
        return
      }

      // Verificar se as frases foram atualizadas hoje
      if (lastQuoteUpdate) {
        const lastUpdate = new Date(lastQuoteUpdate)
        const today = new Date()

        // Se a última atualização não foi hoje, atualizar as frases
        if (lastUpdate.toDateString() !== today.toDateString()) {
          updateAllQuotes()
        }
      }
    }

    // Executar a verificação apenas uma vez na montagem do componente
    checkIfShouldUpdate()

    // Configurar um intervalo para verificar se deve atualizar as frases
    // (útil se o usuário deixar a página aberta por mais de um dia)
    const interval = setInterval(checkIfShouldUpdate, 3600000) // Verificar a cada hora

    return () => clearInterval(interval)
  }, []) // Remover as dependências para evitar o loop

  const saveMessage = () => {
    if (!message.trim()) return

    setSavedMessage(message)
    setLastUpdated(new Date().toLocaleString())
    setMessage("")

    toast({
      title: "Mensagem salva",
      description: "Sua mensagem do dia foi salva com sucesso.",
    })
  }

  // Função para obter a frase atual com base na aba ativa
  const getCurrentQuote = () => {
    switch (activeTab) {
      case "motivational":
        return motivationalQuote
      case "biblical":
        return biblicalQuote
      case "entrepreneurship":
        return entrepreneurshipQuote
      case "personal-dev":
        return personalDevQuote
      case "productivity":
        return productivityQuote
      default:
        return motivationalQuote
    }
  }

  // Função para copiar a frase atual
  const copyCurrentQuote = () => {
    const quote = getCurrentQuote()
    navigator.clipboard.writeText(quote)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)

    toast({
      title: "Frase copiada",
      description: "A frase foi copiada para a área de transferência.",
    })
  }

  // Função para compartilhar a frase atual
  const shareCurrentQuote = () => {
    const quote = getCurrentQuote()

    if (navigator.share) {
      navigator
        .share({
          title: "Frase do Dia",
          text: quote,
        })
        .then(() => {
          toast({
            title: "Frase compartilhada",
            description: "A frase foi compartilhada com sucesso.",
          })
        })
        .catch((error) => {
          console.error("Erro ao compartilhar:", error)
          toast({
            title: "Erro ao compartilhar",
            description: "Não foi possível compartilhar a frase.",
            variant: "destructive",
          })
        })
    } else {
      // Fallback para navegadores que não suportam a API Web Share
      copyCurrentQuote()
    }
  }

  // Função para obter o título da categoria atual
  const getCategoryTitle = () => {
    switch (activeTab) {
      case "motivational":
        return "Frase Motivacional"
      case "biblical":
        return "Frase Bíblica"
      case "entrepreneurship":
        return "Frase de Empreendedorismo"
      case "personal-dev":
        return "Frase de Desenvolvimento Pessoal"
      case "productivity":
        return "Frase de Produtividade"
      default:
        return "Frase do Dia"
    }
  }

  // Função para obter a classe de gradiente com base na categoria
  const getCategoryGradient = () => {
    switch (activeTab) {
      case "motivational":
        return "from-blue-500/10 to-purple-500/10 border-blue-500/30"
      case "biblical":
        return "from-amber-500/10 to-orange-500/10 border-amber-500/30"
      case "entrepreneurship":
        return "from-green-500/10 to-emerald-500/10 border-green-500/30"
      case "personal-dev":
        return "from-pink-500/10 to-rose-500/10 border-pink-500/30"
      case "productivity":
        return "from-cyan-500/10 to-blue-500/10 border-cyan-500/30"
      default:
        return "from-blue-500/10 to-purple-500/10 border-blue-500/30"
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Mensagem do Dia</h1>

      {/* Tabs para diferentes categorias de frases */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="grid grid-cols-5 w-full min-w-max">
            <TabsTrigger value="motivational">Motivacional</TabsTrigger>
            <TabsTrigger value="biblical">Bíblica</TabsTrigger>
            <TabsTrigger value="entrepreneurship">Empreendedorismo</TabsTrigger>
            <TabsTrigger value="personal-dev">Desenvolvimento</TabsTrigger>
            <TabsTrigger value="productivity">Produtividade</TabsTrigger>
          </TabsList>
        </div>

        {/* Conteúdo para cada categoria */}
        <TabsContent value="motivational">
          <Card className={`bg-gradient-to-r ${getCategoryGradient()}`}>
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle className="text-lg sm:text-xl">{getCategoryTitle()}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={copyCurrentQuote} title="Copiar frase">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={shareCurrentQuote} title="Compartilhar frase">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <FavoriteButton id={`quote-motivational`} type="quote" title={motivationalQuote} size="sm" />
                  <Button variant="ghost" size="icon" onClick={updateActiveQuote} title="Atualizar frase">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {lastQuoteUpdate && (
                <p className="text-xs sm:text-sm text-muted-foreground">Atualizada em: {lastQuoteUpdate}</p>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-base sm:text-xl font-medium italic">{motivationalQuote}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biblical">
          <Card className={`bg-gradient-to-r ${getCategoryGradient()}`}>
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle className="text-lg sm:text-xl">{getCategoryTitle()}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={copyCurrentQuote} title="Copiar frase">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={shareCurrentQuote} title="Compartilhar frase">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <FavoriteButton id={`quote-biblical`} type="quote" title={biblicalQuote} size="sm" />
                  <Button variant="ghost" size="icon" onClick={updateActiveQuote} title="Atualizar frase">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {lastQuoteUpdate && (
                <p className="text-xs sm:text-sm text-muted-foreground">Atualizada em: {lastQuoteUpdate}</p>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-base sm:text-xl font-medium italic">{biblicalQuote}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entrepreneurship">
          <Card className={`bg-gradient-to-r ${getCategoryGradient()}`}>
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle className="text-lg sm:text-xl">{getCategoryTitle()}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={copyCurrentQuote} title="Copiar frase">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={shareCurrentQuote} title="Compartilhar frase">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <FavoriteButton id={`quote-entrepreneurship`} type="quote" title={entrepreneurshipQuote} size="sm" />
                  <Button variant="ghost" size="icon" onClick={updateActiveQuote} title="Atualizar frase">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {lastQuoteUpdate && (
                <p className="text-xs sm:text-sm text-muted-foreground">Atualizada em: {lastQuoteUpdate}</p>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-base sm:text-xl font-medium italic">{entrepreneurshipQuote}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal-dev">
          <Card className={`bg-gradient-to-r ${getCategoryGradient()}`}>
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle className="text-lg sm:text-xl">{getCategoryTitle()}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={copyCurrentQuote} title="Copiar frase">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={shareCurrentQuote} title="Compartilhar frase">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <FavoriteButton id={`quote-personal-dev`} type="quote" title={personalDevQuote} size="sm" />
                  <Button variant="ghost" size="icon" onClick={updateActiveQuote} title="Atualizar frase">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {lastQuoteUpdate && (
                <p className="text-xs sm:text-sm text-muted-foreground">Atualizada em: {lastQuoteUpdate}</p>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-base sm:text-xl font-medium italic">{personalDevQuote}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productivity">
          <Card className={`bg-gradient-to-r ${getCategoryGradient()}`}>
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle className="text-lg sm:text-xl">{getCategoryTitle()}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={copyCurrentQuote} title="Copiar frase">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={shareCurrentQuote} title="Compartilhar frase">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <FavoriteButton id={`quote-productivity`} type="quote" title={productivityQuote} size="sm" />
                  <Button variant="ghost" size="icon" onClick={updateActiveQuote} title="Atualizar frase">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {lastQuoteUpdate && (
                <p className="text-xs sm:text-sm text-muted-foreground">Atualizada em: {lastQuoteUpdate}</p>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-base sm:text-xl font-medium italic">{productivityQuote}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator className="my-4" />

      {/* Mensagem Personalizada do Usuário */}
      {savedMessage ? (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <CardTitle className="text-lg sm:text-xl">Sua Mensagem do Dia</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(savedMessage)
                    toast({
                      title: "Mensagem copiada",
                      description: "Sua mensagem foi copiada para a área de transferência.",
                    })
                  }}
                  title="Copiar mensagem"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <FavoriteButton id="personal-message" type="message" title={savedMessage} size="sm" />
              </div>
            </div>
            {lastUpdated && <p className="text-xs sm:text-sm text-muted-foreground">Atualizada em: {lastUpdated}</p>}
          </CardHeader>
          <CardContent>
            <p className="text-base sm:text-xl font-medium whitespace-pre-wrap">{savedMessage}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setMessage(savedMessage)}>
              Editar Mensagem
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Você ainda não definiu uma mensagem do dia personalizada.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{savedMessage ? "Atualizar Mensagem do Dia" : "Definir Mensagem do Dia"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Digite sua mensagem inspiradora ou lembrete para o dia..."
            className="min-h-[150px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={saveMessage}>{savedMessage ? "Atualizar Mensagem" : "Salvar Mensagem"}</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
