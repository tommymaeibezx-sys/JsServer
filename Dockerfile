# Usa una imagen ultra ligera de Node.js basada en Alpine Linux
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de configuración de dependencias
COPY package*.json ./

# Instala solo las librerías necesarias de producción para ahorrar RAM
RUN npm install --only=production

# Copia el código de tu servidor
COPY server.js .

# Expone el puerto que usará Express
EXPOSE 3000

# Comando de arranque por defecto
CMD ["node", "server.js"]
 
