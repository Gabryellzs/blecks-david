// Função para redirecionar para o dashboard de forma confiável
export function redirectToDashboard() {
  // Obter a URL base
  const baseUrl = window.location.origin
  const dashboardUrl = `${baseUrl}/dashboard`

  // Método 1: Redirecionamento direto
  window.location.href = dashboardUrl

  // Método 2: Backup após 500ms se o primeiro método falhar
  setTimeout(() => {
    window.location.replace(dashboardUrl)
  }, 500)

  // Método 3: Último recurso após 1 segundo
  setTimeout(() => {
    document.location.href = dashboardUrl
  }, 1000)
}

// Função para verificar se o usuário está na página correta após o login
export function checkRedirectStatus() {
  // Se estamos na página de login mas deveríamos estar no dashboard
  if (window.location.pathname.includes("/login") && localStorage.getItem("shouldBeInDashboard")) {
    redirectToDashboard()
  }
}
