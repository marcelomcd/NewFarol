@echo off
title NewFarol + ServiceUp - Sistema Completo
color 0A

echo.
echo ========================================
echo    NEWFAROL + PAINEL SERVICE UP
echo    Sistema Unificado
echo ========================================
echo.
echo Iniciando todos os servidores...
echo.

REM Verificar se Python está instalado (não mais necessário para New Farol backend)
REM python --version >nul 2>&1
REM if errorlevel 1 (
REM     echo [ERRO] Python nao encontrado! Instale Python 3.11+ antes de continuar.
REM     pause
REM     exit /b 1
REM )

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado! Instale Node.js 18+ antes de continuar.
    pause
    exit /b 1
)

echo [INFO] Verificando dependencias...
echo.

REM Verificar e instalar dependências do frontend New Farol
if not exist "frontend\node_modules\" (
    echo [AVISO] Dependencias do frontend New Farol nao encontradas.
    echo Instalando dependencias do frontend...
    cd frontend
    if not exist "package.json" (
        echo [ERRO] package.json nao encontrado no frontend!
        cd ..
        pause
        exit /b 1
    )
    call npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias do frontend!
        cd ..
        pause
        exit /b 1
    )
    cd ..
)

REM Verificar e instalar dependências do backend ServiceUp
if not exist "Painel Service UP\backend\node_modules\" (
    echo [AVISO] Dependencias do backend ServiceUp nao encontradas.
    echo Instalando dependencias do backend ServiceUp...
    cd "Painel Service UP\backend"
    if not exist "package.json" (
        echo [ERRO] package.json nao encontrado no backend ServiceUp!
        cd ..\..
        pause
        exit /b 1
    )
    call npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias do backend ServiceUp!
        cd ..\..
        pause
        exit /b 1
    )
    cd ..\..
)

REM Verificar e instalar dependências do frontend ServiceUp
if not exist "Painel Service UP\frontend\node_modules\" (
    echo [AVISO] Dependencias do frontend ServiceUp nao encontradas.
    echo Instalando dependencias do frontend ServiceUp...
    cd "Painel Service UP\frontend"
    if not exist "package.json" (
        echo [ERRO] package.json nao encontrado no frontend ServiceUp!
        cd ..\..
        pause
        exit /b 1
    )
    call npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias do frontend ServiceUp!
        cd ..\..
        pause
        exit /b 1
    )
    cd ..\..
)

REM Verificar e instalar dependências do backend New Farol (Node.js)
if not exist "backend\package.json" (
    echo [ERRO] Pasta backend nao encontrada ou package.json ausente!
    pause
    exit /b 1
)

if not exist "backend\node_modules\" (
    echo [AVISO] Dependencias do backend New Farol nao encontradas.
    echo Instalando dependencias do backend New Farol...
    cd backend
    if not exist "package.json" (
        echo [ERRO] package.json nao encontrado no backend!
        cd ..
        pause
        exit /b 1
    )
    call npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias do backend New Farol!
        cd ..
        pause
        exit /b 1
    )
    cd ..
)

cd backend
if not exist ".env" (
    echo [AVISO] Arquivo .env nao encontrado no backend!
    echo Criando arquivo .env com configuracoes padrao...
    echo AZDO_PAT=6tbJgqgOBZ90vTwy0AFMXfB8dERxvOibJCEcCg7WDNktuG9nRv4XJQQJ99BJACAAAAAV6wmwAAASAZDO4G1l > .env
    echo AZDO_ORG=qualiit >> .env
    echo AZDO_BASE_URL=https://dev.azure.com/qualiit/ >> .env
    echo AZDO_ROOT_PROJECT=Quali IT Inovacao e Tecnologia >> .env
    echo AZDO_API_VERSION=7.0 >> .env
    echo PORT=8000 >> .env
    echo NODE_ENV=development >> .env
    echo FRONTEND_URL=http://localhost:5173 >> .env
    echo SECRET_KEY=dFMhFt-5eyDrhtbamb09UMR1N4D57QUPLjZ6ZtsZ6bY-dev-secret-key-change-in-production >> .env
    echo ALGORITHM=HS256 >> .env
    echo ACCESS_TOKEN_EXPIRE_MINUTES=30 >> .env
    echo AZURE_AD_TENANT_ID=6eb6a2fd-839d-460d-9bb0-7ed15211a782 >> .env
    echo AZURE_AD_CLIENT_ID=87e8d9fc-60fa-4d01-894f-f3753e11004b >> .env
    echo AZURE_AD_CLIENT_SECRET= >> .env
    echo AZURE_AD_REDIRECT_URI=http://localhost:8000/api/auth/callback >> .env
    echo AZURE_AD_IS_PUBLIC_CLIENT=true >> .env
    echo APP_NAME=NewFarol >> .env
    echo DEBUG=false >> .env
    echo [OK] Arquivo .env criado com sucesso!
    echo.
)
cd ..
goto :start_servers

:start_servers
echo.
echo ========================================
echo    Iniciando Servidores
echo ========================================
echo.

REM Iniciar o servidor backend
if exist "backend\package.json" (
    echo [1/4] Iniciando Backend New Farol Node.js Express na porta 8000...
    start "NewFarol Backend" cmd /k "cd /d %~dp0backend && npm run dev"
    goto :start_serviceup
)
echo [ERRO] Pasta backend nao encontrada!
pause
exit /b 1

:start_serviceup

REM Aguardar um pouco para o backend iniciar
timeout /t 3 /nobreak >nul

echo [2/4] Iniciando Backend ServiceUp (Node.js/Express) na porta 3000...
start "ServiceUp Backend" cmd /k "cd "Painel Service UP\backend" && npm run dev"

REM Aguardar um pouco para o backend ServiceUp iniciar
timeout /t 3 /nobreak >nul

echo [3/4] Iniciando Frontend ServiceUp (React/JSX) na porta 5174...
start "ServiceUp Frontend" cmd /k "cd "Painel Service UP\frontend" && npm run dev"

REM Aguardar um pouco para o frontend ServiceUp iniciar
timeout /t 2 /nobreak >nul

echo [4/4] Iniciando Frontend New Farol (React/TypeScript) na porta 5173...
start "NewFarol Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo    Sistema iniciado com sucesso!
echo ========================================
echo.
echo Servidores rodando:
echo   - Backend New Farol:    http://localhost:8000
echo   - Backend ServiceUp:    http://localhost:3000
echo   - Frontend New Farol:   http://localhost:5173
echo   - Frontend ServiceUp:   http://localhost:5174
echo.
echo Paginas disponiveis:
echo   - Dashboard New Farol:  http://localhost:5173
echo   - Painel Service UP:    http://localhost:5173/serviceup (via iframe)
echo   - ServiceUp Standalone:  http://localhost:5174 (direto)
echo.
echo ========================================
echo    IMPORTANTE
echo ========================================
echo.
echo - New Farol funciona sem o backend ServiceUp
echo   (apenas a pagina /serviceup nao funcionara)
echo.
echo - Para usar o Painel Service UP, o backend
echo   Node.js DEVE estar rodando na porta 3000
echo.
echo - Cada sistema e independente e pode ser
echo   mantido separadamente pelos desenvolvedores
echo.
echo ========================================
echo.
echo Pressione qualquer tecla para fechar esta janela...
echo (Os servidores continuarao rodando nas janelas abertas)
pause >nul
