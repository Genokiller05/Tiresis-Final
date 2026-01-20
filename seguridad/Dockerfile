# Usar imagen oficial de Node.js
FROM node:20

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer puertos (Frontend y Backend)
EXPOSE 4200 3000
