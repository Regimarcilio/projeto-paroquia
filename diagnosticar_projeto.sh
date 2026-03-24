#!/bin/bash

echo "========================================="
echo "     DIAGNÓSTICO COMPLETO DO PROJETO"
echo "========================================="
echo ""

echo "📁 1. ESTRUTURA DE DIRETÓRIOS"
echo "----------------------------------------"
pwd
echo ""
ls -la
echo ""

echo "📁 2. ARQUIVOS IMPORTANTES"
echo "----------------------------------------"
find . -type f \( -name "*.js" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.conf" -o -name "*.html" -o -name "Dockerfile*" -o -name ".env" \) 2>/dev/null | grep -v node_modules | sort
echo ""

echo "🐳 3. CONTAINERS DOCKER"
echo "----------------------------------------"
docker ps -a 2>/dev/null || echo "Docker não está rodando"
echo ""

echo "🖼️ 4. IMAGENS DOCKER"
echo "----------------------------------------"
docker images 2>/dev/null | head -10
echo ""

echo "📄 5. ARQUIVO DOCKER-COMPOSE.YML"
echo "----------------------------------------"
cat docker-compose.yml 2>/dev/null || echo "Arquivo não encontrado"
echo ""

echo "🐍 6. DOCKERFILE BACKEND"
echo "----------------------------------------"
cat backend/Dockerfile 2>/dev/null || echo "Arquivo não encontrado"
echo ""

echo "📦 7. BACKEND PACKAGE.JSON"
echo "----------------------------------------"
cat backend/package.json 2>/dev/null || echo "Arquivo não encontrado"
echo ""

echo "🚀 8. BACKEND SERVER.JS"
echo "----------------------------------------"
cat backend/src/server.js 2>/dev/null || echo "Arquivo não encontrado"
echo ""

echo "🔐 9. BACKEND .ENV"
echo "----------------------------------------"
cat backend/.env 2>/dev/null || echo "Arquivo não encontrado"
echo ""

echo "🗄️ 10. PRISMA SCHEMA"
echo "----------------------------------------"
cat backend/prisma/schema.prisma 2>/dev/null || echo "Arquivo não encontrado"
echo ""

echo "🌐 11. NGINX.CONF"
echo "----------------------------------------"
cat nginx/nginx.conf 2>/dev/null || echo "Arquivo não encontrado"
echo ""

echo "🎨 12. FRONTEND - INDEX.HTML (primeiras 30 linhas)"
echo "----------------------------------------"
head -30 frontend/index.html 2>/dev/null || echo "Arquivo não encontrado"
echo ""

echo "🔑 13. FRONTEND - PÁGINA DE LOGIN"
echo "----------------------------------------"
cat frontend/pages/admin/login.html 2>/dev/null || echo "Arquivo não encontrado"
echo ""

echo "📋 14. OUTRAS PÁGINAS FRONTEND"
echo "----------------------------------------"
ls -la frontend/*.html 2>/dev/null || echo "Nenhum arquivo HTML encontrado"
echo ""
ls -la frontend/pages/admin/*.html 2>/dev/null || echo "Nenhuma página admin encontrada"
echo ""

echo "📊 15. LOGS DO BACKEND"
echo "----------------------------------------"
BACKEND_CONTAINER=$(docker ps -a | grep -E "backend|back" | awk '{print $1}' | head -1)
if [ ! -z "$BACKEND_CONTAINER" ]; then
    docker logs $BACKEND_CONTAINER --tail 30 2>&1
else
    echo "Container backend não encontrado"
fi
echo ""

echo "🌐 16. LOGS DO NGINX"
echo "----------------------------------------"
NGINX_CONTAINER=$(docker ps -a | grep nginx | awk '{print $1}' | head -1)
if [ ! -z "$NGINX_CONTAINER" ]; then
    docker logs $NGINX_CONTAINER --tail 30 2>&1
else
    echo "Container nginx não encontrado"
fi
echo ""

echo "🔌 17. TESTE DE CONEXÃO - BACKEND DIRETO"
echo "----------------------------------------"
curl -s http://localhost:8000/api/health 2>&1 || echo "Falha na conexão"
echo ""

echo "🔌 18. TESTE DE CONEXÃO - VIA NGINX"
echo "----------------------------------------"
curl -s http://localhost/api/health 2>&1 || echo "Falha na conexão"
echo ""

echo "🔌 19. TESTE DE CONEXÃO - PÁGINA ADMIN"
echo "----------------------------------------"
curl -s -o /dev/null -w "%{http_code}" http://localhost/pages/admin/login.html 2>&1 || echo "Falha"
echo ""

echo "🖥️ 20. PORTAS EM USO"
echo "----------------------------------------"
netstat -tlnp 2>/dev/null | grep -E ":(80|3000|8000|5432)" || echo "Nenhuma porta encontrada"
echo ""

echo "📝 21. VARIÁVEIS DE AMBIENTE DO BACKEND"
echo "----------------------------------------"
docker exec $BACKEND_CONTAINER env 2>/dev/null | grep -E "DATABASE|JWT|PORT" || echo "Container não rodando"
echo ""

echo "✅ 22. VERIFICAÇÃO FINAL"
echo "----------------------------------------"
echo "Backend respondendo: $(curl -s http://localhost:8000/api/health | grep -o 'healthy' || echo 'NÃO')"
echo "Nginx respondendo: $(curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q 200 && echo 'SIM' || echo 'NÃO')"
echo "Página Admin acessível: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/pages/admin/login.html | grep -q 200 && echo 'SIM' || echo 'NÃO')"
echo ""

echo "========================================="
echo "     FIM DO DIAGNÓSTICO"
echo "========================================="
