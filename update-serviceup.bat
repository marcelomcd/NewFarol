@echo off
title Sincronizar Painel Service UP do Repositório Davi Silva
color 0A

echo.
echo ========================================
echo    SINCRONIZAR PAINEL SERVICE UP
echo    Repositorio: Qualiit.Portal.Clientes.v2
echo    Autor: Davi Silva
echo ========================================
echo.

REM Verificar se Git está instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Git nao encontrado! Instale Git antes de continuar.
    pause
    exit /b 1
)

REM Navegar para o diretório do script (garantir caminho absoluto)
cd /d %~dp0

REM URL do repositório do Davi Silva
set REPO_URL=https://dev.azure.com/qualiit/ALM/_git/Qualiit.Portal.Clientes.v2
set TEMP_DIR=temp_serviceup_sync
set TARGET_DIR=Painel Service UP

echo [INFO] Iniciando sincronizacao do Painel Service UP...
echo Repositorio: %REPO_URL%
echo.

REM Criar diretório temporário para clone
if exist "%TEMP_DIR%" (
    echo [INFO] Removendo diretorio temporario existente...
    rmdir /s /q "%TEMP_DIR%"
    if errorlevel 1 (
        echo [ERRO] Nao foi possivel remover o diretorio temporario!
        echo Certifique-se de que nao ha processos usando essa pasta.
        pause
        exit /b 1
    )
)

echo [1/4] Clonando repositorio do Davi Silva...
git clone %REPO_URL% %TEMP_DIR%
if errorlevel 1 (
    echo [ERRO] Falha ao clonar o repositorio!
    echo Certifique-se de ter acesso ao repositorio e credenciais configuradas.
    pause
    exit /b 1
)

REM Verificar se o clone foi bem-sucedido
if not exist "%TEMP_DIR%" (
    echo [ERRO] Diretorio temporario nao foi criado!
    pause
    exit /b 1
)

echo.
echo [2/4] Removendo README.md do clone temporario...
if exist "%TEMP_DIR%\README.md" (
    del /f /q "%TEMP_DIR%\README.md"
    echo [OK] README.md removido
) else (
    echo [AVISO] README.md nao encontrado no repositorio
)

echo.
echo [3/4] Sincronizando arquivos para "Painel Service UP"...

REM Criar diretório de destino se não existir
if not exist "%TARGET_DIR%" (
    echo [INFO] Criando diretorio "%TARGET_DIR%"...
    mkdir "%TARGET_DIR%"
)

REM Preservar arquivos locais importantes antes da sincronização
echo [INFO] Preservando arquivos locais importantes...
set PRESERVE_DIR=%TARGET_DIR%_preserve
if not exist "%PRESERVE_DIR%" mkdir "%PRESERVE_DIR%"

REM Preservar .env do backend (se existir)
if exist "%TARGET_DIR%\backend\.env" (
    echo [INFO] Preservando .env do backend...
    if not exist "%PRESERVE_DIR%\backend" mkdir "%PRESERVE_DIR%\backend"
    copy /y "%TARGET_DIR%\backend\.env" "%PRESERVE_DIR%\backend\.env" >nul 2>&1
)

REM Preservar node_modules (não vamos copiar de novo, mas vamos manter se existir)
echo [INFO] Preservando node_modules...
if exist "%TARGET_DIR%\backend\node_modules" (
    echo [INFO] node_modules do backend sera preservado
)
if exist "%TARGET_DIR%\frontend\node_modules" (
    echo [INFO] node_modules do frontend sera preservado
)

REM Usar robocopy para sincronizar (mais robusto que xcopy)
REM /E = incluir subdiretórios e arquivos vazios
REM /XD = excluir diretórios específicos
REM /XF = excluir arquivos específicos
REM /NFL = não listar arquivos
REM /NDL = não listar diretórios
REM /NJH = não exibir cabeçalho de trabalho
REM /NJS = não exibir resumo
REM /R:3 = 3 tentativas em caso de erro
REM /W:1 = esperar 1 segundo entre tentativas

echo [INFO] Copiando arquivos do repositorio...
robocopy "%TEMP_DIR%" "%TARGET_DIR%" /E /XD ".git" "node_modules" "%PRESERVE_DIR%" /XF "README.md" /NFL /NDL /NJH /NJS /R:3 /W:1

REM Verificar código de saída do robocopy
REM 0-7 são códigos de sucesso do robocopy
if errorlevel 8 (
    echo [ERRO] Falha ao copiar arquivos!
    pause
    exit /b 1
)

echo [OK] Arquivos sincronizados com sucesso

REM Restaurar arquivos preservados
echo.
echo [4/4] Restaurando arquivos preservados...
if exist "%PRESERVE_DIR%\backend\.env" (
    echo [INFO] Restaurando .env do backend...
    copy /y "%PRESERVE_DIR%\backend\.env" "%TARGET_DIR%\backend\.env" >nul 2>&1
)

REM Limpar diretório temporário
echo.
echo [INFO] Limpando arquivos temporarios...
rmdir /s /q "%PRESERVE_DIR%" >nul 2>&1
rmdir /s /q "%TEMP_DIR%" >nul 2>&1

echo.
echo ========================================
echo    SINCRONIZACAO CONCLUIDA
echo ========================================
echo.
echo O Painel Service UP foi sincronizado com sucesso!
echo.
echo Arquivos atualizados:
echo   - Todos os arquivos do repositorio %REPO_URL%
echo   - README.md foi excluido (nao copiado)
echo   - Arquivos locais (.env, node_modules) foram preservados
echo.
echo Proximos passos:
echo   1. Execute "start.bat" para iniciar o sistema completo
echo   2. Ou execute apenas o Service UP usando o backend e frontend
echo.
echo ========================================
echo.
pause
