@echo off
title Atualizar Submodule Painel Service UP
color 0A

echo.
echo ========================================
echo    ATUALIZAR PAINEL SERVICE UP
echo    (Git Submodule)
echo ========================================
echo.

REM Verificar se estamos no diretório correto
if not exist "Painel Service UP" (
    echo [ERRO] Pasta "Painel Service UP" nao encontrada!
    echo Certifique-se de estar na raiz do projeto New Farol.
    pause
    exit /b 1
)

echo [INFO] Atualizando submodule Painel Service UP...
echo.

REM Navegar para o submodule e atualizar
cd "Painel Service UP"
echo [1/3] Verificando branch atual...
git checkout main
if errorlevel 1 (
    echo [AVISO] Nao foi possivel fazer checkout da branch main.
    echo Continuando com a branch atual...
)

echo.
echo [2/3] Fazendo pull das alteracoes mais recentes...
git pull origin main
if errorlevel 1 (
    echo [ERRO] Falha ao fazer pull do repositorio Service UP!
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo [3/3] Atualizando referencia no repositorio principal...
git add "Painel Service UP"
if errorlevel 1 (
    echo [ERRO] Falha ao adicionar alteracoes do submodule!
    pause
    exit /b 1
)

REM Perguntar se deseja fazer commit
echo.
echo ========================================
echo    ALTERACOES PREPARADAS
echo ========================================
echo.
echo O submodule foi atualizado e esta pronto para commit.
echo.
set /p COMMIT="Deseja fazer commit automaticamente? (S/N): "

if /i "%COMMIT%"=="S" (
    git commit -m "Update Painel Service UP submodule - %date% %time%"
    if errorlevel 1 (
        echo [AVISO] Falha ao fazer commit automaticamente.
        echo Voce pode fazer o commit manualmente com:
        echo   git commit -m "Update Painel Service UP"
    ) else (
        echo.
        echo [OK] Commit realizado com sucesso!
        echo.
        set /p PUSH="Deseja fazer push para o repositorio remoto? (S/N): "
        if /i "%PUSH%"=="S" (
            git push origin main
            if errorlevel 1 (
                echo [AVISO] Falha ao fazer push. Verifique sua conexao.
            ) else (
                echo [OK] Push realizado com sucesso!
            )
        )
    )
) else (
    echo.
    echo [INFO] Alteracoes preparadas, mas commit nao realizado.
    echo Para fazer commit manualmente, execute:
    echo   git commit -m "Update Painel Service UP submodule"
    echo.
)

echo.
echo ========================================
echo    ATUALIZACAO CONCLUIDA
echo ========================================
echo.
echo Status do submodule:
git submodule status
echo.
pause
