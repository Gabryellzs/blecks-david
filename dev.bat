@echo off
setlocal
cd /d "%~dp0"
title Dev - %cd%

where node >nul 2>&1 || (echo [ERRO] Node nao encontrado no PATH. & goto stay)

if not exist node_modules (
  echo Instalando dependencias...
  call npm ci || goto stay
)

echo Subindo o servidor...
call npm run dev
echo Servidor saiu com codigo %errorlevel%.

:stay
echo (Janela nao vai fechar automaticamente.)
cmd /k
endlocal
