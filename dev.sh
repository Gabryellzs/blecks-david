#!/bin/bash
# Título da janela (funciona em alguns terminais como iTerm2)
echo "=== Dev - $(pwd) ==="

# Verifica se o Node está no PATH
if ! command -v node >/dev/null 2>&1; then
  echo "[ERRO] Node não encontrado no PATH."
  exec $SHELL
fi

# Instala dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
  echo "Instalando dependências..."
  npm ci || exec $SHELL
fi

# Sobe o servidor
echo "Subindo o servidor..."
npm run dev
echo "Servidor saiu com código $?"

# Mantém o terminal aberto
echo "(O terminal não vai fechar automaticamente.)"
exec $SHELL
