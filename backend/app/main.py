"""
FastAPI application entry point.

Seguindo Clean Architecture e boas práticas de engenharia de software.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.core.logging_config import setup_logging

logger = logging.getLogger(__name__)

# Importar rotas antigas temporariamente para compatibilidade
from app.api.routes import (
    features,
    projects,
    reports,
    webhooks,
    auth,
    export,
    features_analytics,
    work_items,
    azdo_consolidated,
)
# Importar novas rotas v2 (arquitetura limpa)
from app.api.routes import clients, features_v2
from fastapi import Request
from fastapi.responses import RedirectResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.middleware.exception_handler import (
    global_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    work_item_not_found_handler,
    azure_devops_connection_handler,
    invalid_query_handler,
    burndown_calculation_handler,
)
from app.api.exceptions import (
    WorkItemNotFoundError,
    AzureDevOpsConnectionError,
    InvalidQueryError,
    BurndownCalculationError,
)

# Novos middlewares e handlers
from app.api.middleware.rate_limit import (
    RateLimitMiddleware,
    RequestIDMiddleware,
    LoggingMiddleware
)
from app.api.middleware.error_handler_v2 import register_exception_handlers

settings = get_settings()

# Configurar logging
setup_logging(debug=settings.debug)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle events da aplicação.
    
    Gerencia eventos de inicialização e encerramento.
    """
    # Startup
    logger = app.state.logger if hasattr(app.state, "logger") else None
    if logger:
        logger.info("Application starting up")
    
    yield
    
    # Shutdown
    if logger:
        logger.info("Application shutting down")


app = FastAPI(
    title="Farol Operacional API - Quali IT",
    description="""
    # API de Integração com Azure DevOps - Farol Operacional
    
    API completa para obtenção de dados do Azure DevOps para o sistema Farol Operacional.
    
    ## Padrão de Execução
    
    Todos os endpoints seguem o padrão obrigatório de duas etapas:
    
    1. **WIQL (Work Item Query Language)**: Executa query WIQL via POST para obter IDs dos Work Items
    2. **Hidratação**: Busca detalhes completos usando GET workitems?ids=... com os campos necessários
    
    Este padrão garante que os dados sejam sempre consistentes com o Azure DevOps e otimiza
    a performance através de processamento em paralelo quando possível.
    
    ## Fonte Canônica
    
    Todos os dados são obtidos diretamente do Azure DevOps via API oficial (WIQL + Work Items API),
    garantindo consistência total entre o sistema e o DevOps. Não há cache ou sincronização intermediária
    que possa causar divergências.
    
    ## Autenticação
    
    **Backend:**
    - Usa PAT (Personal Access Token) configurado via variável de ambiente `AZDO_PAT` (PAT puro) ou `AZDO_AUTH_BASIC` (Basic token já codificado)
    - O PAT é enviado via Basic Authentication na requisição ao Azure DevOps
    
    **Frontend:**
    - Token JWT opcional no query parameter `token`
    - Se fornecido, aplica filtro automático por cliente (usuários não-admin veem apenas seu cliente)
    - Usuários @qualiit.com.br (admin) veem todos os dados
    
    ## Endpoints Principais
    
    - **GET /api/azdo/consolidated**: Endpoint consolidado com todos os indicadores (Dashboard)
    - **GET /api/features/open/wiql**: Features em aberto (State <> Closed)
    - **GET /api/features/closed/wiql**: Features encerradas (State = Closed)
    - **GET /api/features/counts/wiql**: Contagens agregadas (leve, sem hidratação completa)
    - **GET /api/features/by-state/wiql**: Features agrupadas por status
    - **GET /api/features/by-farol/wiql**: Features agrupadas por status do farol
    - **GET /api/clients/valid**: Lista de clientes válidos (extraídos de Epics)
    """,
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Middlewares (ordem importa - do externo para interno)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID - primeiro middleware para todas as requests terem ID
app.add_middleware(RequestIDMiddleware)

# Logging - logar todas as requisições
app.add_middleware(LoggingMiddleware)

# Rate Limiting - proteger contra abuso
app.add_middleware(
    RateLimitMiddleware,
    default_requests_per_minute=60,
    burst_size=10
)

# Registrar handlers de exceção
# Manter handlers antigos para compatibilidade
app.add_exception_handler(WorkItemNotFoundError, work_item_not_found_handler)
app.add_exception_handler(AzureDevOpsConnectionError, azure_devops_connection_handler)
app.add_exception_handler(InvalidQueryError, invalid_query_handler)
app.add_exception_handler(BurndownCalculationError, burndown_calculation_handler)

# Registrar novos handlers (têm prioridade sobre os antigos)
register_exception_handlers(app)

# Incluir rotas antigas (mantendo compatibilidade)
# TODO: Migrar todas as rotas para /api/v1/
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(projects.router, prefix="/api", tags=["projects"])
app.include_router(features.router, prefix="/api", tags=["📋 Features (WIQL)"])
app.include_router(reports.router, prefix="/api", tags=["reports"])
app.include_router(export.router, prefix="/api", tags=["export"])
# chamados removido - agora é backend independente (Node.js)
app.include_router(features_analytics.router, prefix="/api", tags=["features-analytics"])
app.include_router(work_items.router, prefix="/api", tags=["work-items"])
app.include_router(azdo_consolidated.router, prefix="/api", tags=["📊 Azure DevOps - Consolidado"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])

# Novas rotas v2 (arquitetura limpa)
app.include_router(clients.router, prefix="/api/v2", tags=["clients-v2"])
app.include_router(features_v2.router, prefix="/api/v2", tags=["features-v2"])

# Rotas de debug (apenas em desenvolvimento)
if settings.debug:
    from app.api.routes import debug
    app.include_router(debug.router, prefix="/api/debug", tags=["debug"])

# Quando todas as rotas estiverem migradas para v1, descomentar:
# from app.api.v1 import api_router
# app.include_router(api_router)


@app.get("/", summary="Root")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "app": settings.app_name}


@app.get("/health", summary="Health Check")
async def health():
    """Health check detalhado."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": "1.0.0",
    }

