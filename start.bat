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

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado! Instale Python 3.11+ antes de continuar.
    pause
    exit /b 1
)

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

REM Verificar e criar ambiente virtual do backend New Farol se necessário
cd backend
if not exist "venv\" (
    echo [AVISO] Ambiente virtual do backend New Farol nao encontrado.
    echo Criando ambiente virtual...
    python -m venv venv
    if errorlevel 1 (
        echo [ERRO] Falha ao criar ambiente virtual!
        cd ..
        pause
        exit /b 1
    )
)

REM Verificar se as dependências do backend New Farol estão instaladas
call venv\Scripts\activate.bat
python -c "import fastapi, uvicorn" >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Dependencias do backend New Farol nao encontradas.
    echo Instalando dependencias do backend...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias do backend!
        cd ..
        pause
        exit /b 1
    )
)
cd ..

echo.
echo ========================================
echo    Iniciando Servidores
echo ========================================
echo.

echo [1/3] Iniciando Backend New Farol (Python/FastAPI) na porta 8000...
if exist "backend\start_server.py" (
    start "NewFarol Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && python start_server.py"
) else (
    start "NewFarol Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
)

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
