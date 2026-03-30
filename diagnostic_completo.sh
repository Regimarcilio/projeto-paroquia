#!/bin/bash
echo "=== DIAGNÓSTICO COMPLETO ==="
echo ""
echo "1. Containers rodando:"
docker ps -a
echo ""
echo "2. Portas abertas:"
netstat -tlnp 2>/dev/null | grep -E ":(80|8002|5432)" || echo "Nenhuma porta encontrada"
echo ""
echo "3. Arquivos frontend:"
ls -la frontend/ | head -20
echo ""
echo "4. Arquivos admin:"
ls -la frontend/pages/admin/ 2>/dev/null || echo "Pasta admin não existe"
echo ""
echo "5. Configuração Nginx:"
cat nginx/nginx.conf | grep -A10 "location /api"
echo ""
echo "6. Últimos logs Nginx:"
docker logs paroquia_nginx --tail 20 2>&1
echo ""
echo "7. Últimos logs Backend:"
docker logs paroquia_backend --tail 20 2>&1
echo ""
echo "=== FIM DIAGNÓSTICO ==="
