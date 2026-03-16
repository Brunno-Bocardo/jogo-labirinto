.PHONY: dev dev-stop prod prod-stop build clean logs

# Desenvolvimento — monta volumes, qualquer mudanca reflete ao vivo
dev:
	docker compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "  Dev rodando em http://localhost:3000"
	@echo "  Edite os arquivos e recarregue o browser."
	@echo ""

dev-stop:
	docker compose -f docker-compose.dev.yml down

# Producao — build da imagem e roda
prod: build
	docker compose up -d
	@echo ""
	@echo "  Producao rodando em http://localhost:8080"
	@echo ""

prod-stop:
	docker compose down

# Build da imagem
build:
	docker build -t labirinto .

# Logs
logs:
	docker compose -f docker-compose.dev.yml logs -f

# Limpar tudo
clean:
	docker compose -f docker-compose.dev.yml down --rmi local 2>/dev/null || true
	docker compose down --rmi local 2>/dev/null || true
	docker rmi labirinto 2>/dev/null || true
	@echo "Limpo."
