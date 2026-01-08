"""Configurações da aplicação e variáveis de ambiente."""
from functools import lru_cache
from typing import Optional
import sys

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, Field


class Settings(BaseSettings):
    """
    Configurações da aplicação.
    
    IMPORTANTE: Todas as credenciais sensíveis DEVEM vir de variáveis de ambiente.
    Valores default são apenas para facilitar desenvolvimento local não-produtivo.
    """

    # Azure DevOps - OBRIGATÓRIO via variável de ambiente
    azdo_pat: str = Field(
        ...,  # Campo obrigatório, sem valor default
        description="Personal Access Token do Azure DevOps (variável de ambiente AZDO_PAT obrigatória)"
    )
    azdo_org: str = Field(
        default="qualiit",
        description="Organização do Azure DevOps"
    )
    azdo_base_url: str = Field(
        default="https://dev.azure.com/qualiit/",
        description="URL base do Azure DevOps"
    )
    azdo_root_project: str = Field(
        default="Quali IT - Inovação e Tecnologia",
        description="Projeto raiz do Azure DevOps"
    )
    azdo_api_version: str = "7.0"

    # Database
    database_url: str = Field(
        default="sqlite:///./newfarol.db",
        description="URL de conexão do banco principal (SQLite para dev, PostgreSQL/MySQL para prod)"
    )
    
    # MySQL Database (Service Up) - OPCIONAL (não usado mais no backend Python)
    mysql_host: Optional[str] = Field(
        default=None,
        description="Host do MySQL (opcional - ServiceUp agora usa backend Node.js independente)"
    )
    mysql_port: Optional[int] = Field(
        default=3306,
        description="Porta do MySQL (opcional)"
    )
    mysql_user: Optional[str] = Field(
        default=None,
        description="Usuário do MySQL (opcional - ServiceUp agora usa backend Node.js independente)"
    )
    mysql_password: Optional[str] = Field(
        default=None,
        description="Senha do MySQL (opcional - ServiceUp agora usa backend Node.js independente)"
    )
    mysql_database: Optional[str] = Field(
        default=None,
        description="Nome do banco MySQL (opcional - ServiceUp agora usa backend Node.js independente)"
    )

    # Azure AD OIDC
    azure_ad_tenant_id: Optional[str] = Field(
        default=None,
        description="Tenant ID do Azure AD"
    )
    azure_ad_client_id: Optional[str] = Field(
        default=None,
        description="Client ID da aplicação Azure AD"
    )
    azure_ad_client_secret: Optional[str] = Field(
        default=None,
        description="Client Secret da aplicação Azure AD"
    )
    azure_ad_redirect_uri: Optional[str] = Field(
        default=None,
        description="URI de redirecionamento OAuth2"
    )
    azure_ad_is_public_client: bool = True

    # Security - OBRIGATÓRIO via variável de ambiente
    secret_key: str = Field(
        ...,  # Campo obrigatório
        min_length=32,
        description="Chave secreta para assinatura JWT (variável SECRET_KEY obrigatória, mínimo 32 caracteres)"
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Application
    app_name: str = "NewFarol"
    debug: bool = False
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
        description="Origins permitidas para CORS (em produção, especificar apenas domínios necessários)"
    )

    # Monitoring
    enable_metrics: bool = True
    metrics_port: int = 9090

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Valida que a secret key não é o valor default inseguro."""
        dangerous_values = [
            "change-me-in-production",
            "secret",
            "password",
            "admin",
            "test",
            "dev",
            "development",
        ]
        if v.lower() in dangerous_values:
            raise ValueError(
                f"SECRET_KEY insegura detectada: '{v}'. "
                "Use uma chave forte gerada aleatoriamente. "
                "Exemplo: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
        return v

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, v: list[str]) -> list[str]:
        """Valida configuração de CORS em produção."""
        if "*" in v:
            raise ValueError(
                "CORS com wildcard (*) não é permitido. "
                "Especifique origins exatos para segurança."
            )
        return v

    def is_production(self) -> bool:
        """Verifica se está rodando em produção."""
        return not self.debug and "localhost" not in self.database_url

    def validate_production_config(self) -> None:
        """Valida configurações críticas para produção."""
        if self.is_production():
            errors = []
            
            # Validar banco de dados
            if "sqlite" in self.database_url.lower():
                errors.append("SQLite não deve ser usado em produção")
            
            # Validar CORS
            for origin in self.cors_origins:
                if "localhost" in origin or "127.0.0.1" in origin:
                    errors.append(f"CORS origin de localhost não permitido em produção: {origin}")
            
            # Validar HTTPS
            if not all(origin.startswith("https://") for origin in self.cors_origins):
                errors.append("Todos os CORS origins devem usar HTTPS em produção")
            
            if errors:
                raise ValueError(
                    "Configuração inválida para produção:\n" + 
                    "\n".join(f"  - {error}" for error in errors)
                )


@lru_cache()
def get_settings() -> Settings:
    """Retorna instância singleton das configurações."""
    # Força recarregar o arquivo .env a cada chamada (útil durante desenvolvimento)
    # Em produção, o cache é mantido para performance
    return Settings()

