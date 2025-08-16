// Utilitários para depuração e redirecionamento de autenticação

// Função para registrar logs detalhados
export function logAuthEvent(event: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[AUTH ${timestamp}] ${event}`, data || "")

  // Armazenar logs para depuração
  const logs = JSON.parse(localStorage.getItem("auth_debug_logs") || "[]")
  logs.push({ timestamp, event, data })
  localStorage.setItem("auth_debug_logs", JSON.stringify(logs.slice(-20))) // Manter apenas os últimos 20 logs
}

// Função para redirecionar para o dashboard com múltiplos métodos
export function redirectToDashboard() {
  try {
    // Obter a URL base completa
    const baseUrl = window.location.origin
    const dashboardUrl = `${baseUrl}/dashboard`

    logAuthEvent("Iniciando redirecionamento para", dashboardUrl)

    // Armazenar informação de que o redirecionamento foi iniciado
    localStorage.setItem("auth_redirect_attempted", "true")
    localStorage.setItem("auth_redirect_timestamp", Date.now().toString())

    // Método 1: Redirecionamento direto com URL completa
    logAuthEvent("Tentando redirecionamento com window.location.href")
    window.location.href = dashboardUrl

    // Método 2: Backup após 500ms se o primeiro método falhar
    setTimeout(() => {
      logAuthEvent("Tentando redirecionamento com window.location.replace")
      window.location.replace(dashboardUrl)
    }, 500)

    // Método 3: Último recurso após 1 segundo
    setTimeout(() => {
      logAuthEvent("Tentando redirecionamento com document.location.href")
      document.location.href = dashboardUrl
    }, 1000)

    // Método 4: Criar e clicar em um link
    setTimeout(() => {
      logAuthEvent("Tentando redirecionamento com link programático")
      const link = document.createElement("a")
      link.href = dashboardUrl
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }, 1500)
  } catch (error) {
    logAuthEvent("Erro durante redirecionamento", error)
  }
}

// Função para limpar cache e cookies relacionados à autenticação
export function clearAuthCache() {
  try {
    logAuthEvent("Limpando cache de autenticação")

    // Limpar localStorage relacionado à autenticação
    const authKeys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes("supabase") || key.includes("auth"))) {
        authKeys.push(key)
      }
    }

    authKeys.forEach((key) => {
      localStorage.removeItem(key)
    })

    // Limpar sessionStorage relacionado à autenticação
    const sessionAuthKeys = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (key.includes("supabase") || key.includes("auth"))) {
        sessionAuthKeys.push(key)
      }
    }

    sessionAuthKeys.forEach((key) => {
      sessionStorage.removeItem(key)
    })

    logAuthEvent("Cache de autenticação limpo", { localStorage: authKeys, sessionStorage: sessionAuthKeys })
    return true
  } catch (error) {
    logAuthEvent("Erro ao limpar cache", error)
    return false
  }
}

// Verificar se há problemas de redirecionamento pendentes
export function checkPendingRedirect() {
  const redirectAttempted = localStorage.getItem("auth_redirect_attempted")
  const redirectTimestamp = localStorage.getItem("auth_redirect_timestamp")

  if (redirectAttempted && redirectTimestamp) {
    const now = Date.now()
    const timestamp = Number.parseInt(redirectTimestamp, 10)
    const timePassed = now - timestamp

    // Se passou mais de 5 segundos desde a última tentativa de redirecionamento
    if (timePassed > 5000) {
      logAuthEvent("Detectado redirecionamento pendente", { timePassed })
      return true
    }
  }

  return false
}

// Verificar compatibilidade do navegador
export function checkBrowserCompatibility() {
  const browser = {
    name: "unknown",
    version: "unknown",
    localStorage: typeof localStorage !== "undefined",
    sessionStorage: typeof sessionStorage !== "undefined",
    cookies: navigator.cookieEnabled,
  }

  // Detectar navegador
  const userAgent = navigator.userAgent
  if (userAgent.indexOf("Chrome") > -1) {
    browser.name = "Chrome"
  } else if (userAgent.indexOf("Safari") > -1) {
    browser.name = "Safari"
  } else if (userAgent.indexOf("Firefox") > -1) {
    browser.name = "Firefox"
  } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
    browser.name = "Internet Explorer"
  } else if (userAgent.indexOf("Edge") > -1) {
    browser.name = "Edge"
  }

  logAuthEvent("Verificação de compatibilidade do navegador", browser)
  return browser
}
