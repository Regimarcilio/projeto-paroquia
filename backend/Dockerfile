FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/data /app/uploads/noticias /app/uploads/galeria

EXPOSE 8002

CMD ["npm", "start"]
