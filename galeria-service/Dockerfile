FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o resto dos arquivos
COPY . .

# Criar pasta para uploads
RUN mkdir -p /app/uploads

# Expor porta 8002
EXPOSE 8002

# Iniciar servidor
CMD ["node", "server.js"]
