#!/bin/bash

echo "========================================="
echo "   DIAGNÓSTICO COMPLETO DO PROJETO"
echo "   (Sem fazer alterações)"
echo "========================================="
echo ""

echo "📁 1. DIRETÓRIO ATUAL:"
pwd
echo ""

echo "📁 2. ESTRUTURA COMPLETA:"
find . -type f | grep -v node_modules | grep -v .git | sort
echo ""

echo "📄 3. CONTEÚDO DO DOCKER-COMPOSE.YML:"
if [ -f "docker-compose.yml" ]; then
    cat docker-compose.yml
else
    echo "Arquivo não encontrado"
fi
echo ""

echo "📄 4. CONTEÚDO DO NGINX.CONF:"
if [ -f "nginx/nginx.conf" ]; then
    cat nginx/nginx.conf
else
    echo "Arquivo não encontrado"
fi
echo ""

echo "📄 5. CONTEÚDO DO BACKEND PACKAGE.JSON:"
if [ -f "backend/package.json" ]; then
    cat backend/package.json
else
    echo "Arquivo não encontrado"
fi
echo ""

echo "📄 6. CONTEÚDO DO BACKEND SERVER.JS:"
if [ -f "backend/src/server.js" ]; then
    cat backend/src/server.js
else
    echo "Arquivo não encontrado"
    # Verificar se tem outro arquivo
    find backend -name "*.js" 2>/dev/null
fi
echo ""

echo "📄 7. CONTEÚDO DO FRONTEND INDEX.HTML (apenas a parte do fetch):"
if [ -f "frontend/index.html" ]; then
    grep -A5 -B5 "fetch" frontend/index.html 2>/dev/null | head -30
else
    echo "Arquivo não encontrado"
fi
echo ""

echo "📄 8. CONTEÚDO DO FRONTEND LOGIN.HTML (apenas a parte do fetch):"
if [ -f "frontend/pages/admin/login.html" ]; then
    grep -A10 -B5 "fetch" frontend/pages/admin/login.html 2>/dev/null | head -40
else
    echo "Arquivo não encontrado"
fi
echo ""

echo "🐳 9. CONTAINERS RODANDO:"
docker ps -a
echo ""

echo "📊 10. LOGS DO BACKEND:"
BACKEND_CONTAINER=$(docker ps -a | grep -E "backend|back" | awk '{print $1}' | head -1)
if [ ! -z "$BACKEND_CONTAINER" ]; then
    docker logs $BACKEND_CONTAINER --tail 30 2>&1
else
    echo "Nenhum container backend encontrado"
fi
echo ""

echo "🌐 11. LOGS DO NGINX:"
NGINX_CONTAINER=$(docker ps -a | grep nginx | awk '{print $1}' | head -1)
if [ ! -z "$NGINX_CONTAINER" ]; then
    docker logs $NGINX_CONTAINER --tail 30 2>&1
else
    echo "Nenhum container nginx encontrado"
fi
echo ""

echo "🔌 12. TESTE DIRETO BACKEND:"
curl -s http://localhost:8000/api/health 2>&1 || echo "Falha"
echo ""

echo "🔌 13. TESTE VIA NGINX:"
curl -s http://localhost/api/health 2>&1 || echo "Falha"
echo ""

echo "🔌 14. TESTE PÁGINA ADMIN:"
curl -s -I http://localhost/pages/admin/login.html 2>&1 | head -5
echo ""

echo "========================================="
echo "FIM DO DIAGNÓSTICO - NADA FOI ALTERADO"
echo "========================================="
