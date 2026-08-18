###############################################################################
# 0) Parámetros de versión
###############################################################################
ARG NODE_VERSION=24.19.0

###############################################################################
# 1) Base – Imagen de Node con utilidades mínimas
###############################################################################
FROM node:${NODE_VERSION} AS base

# 1.1 Establecer directorio de trabajo común
WORKDIR /app

# 1.2 Instalar y actualizar paquetes mínimos
RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates git curl bash \
 && rm -rf /var/lib/apt/lists/*

# 1.3 Instalar npm como gestor de paquetes
RUN npm install -g npm@11.19.0

###############################################################################
# 2) Deps – Instalación de dependencias de la app
###############################################################################
FROM base AS deps

# Re-exponer los ARG dentro de la etapa
ARG NODE_VERSION

# 2.1 Copiar lockfiles primero para aprovechar la cache de capas
COPY package.json package-lock.json ./

# 2.2 Instalar dependencias con BuildKit cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --progress=false

###############################################################################
# 3) Builder – Compilación de la aplicación
###############################################################################
FROM base AS builder

# 3.1 Copiar node_modules de la etapa deps
COPY --from=deps /app/node_modules ./node_modules

# 3.2 Copiar el resto del código fuente
COPY . .

# 3.3 Construir el build (Next.js)
RUN npm run build

###############################################################################
# 4) Runner – Imagen final de ejecución
###############################################################################
FROM node:${NODE_VERSION} AS runner

# Re-exponer los ARG dentro de la etapa
ARG NODE_VERSION

# 4.1 Crear usuario no-root para mayor seguridad
RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs nextjs

# 4.2 Establecer directorio de trabajo
WORKDIR /app

# 4.3 Copiar artefactos de build (standalone) y archivos públicos
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 4.4 Variables de entorno de ejecución
ENV NODE_ENV=production
ENV PORT=3000

# 4.5 Cambiar a usuario seguro
USER nextjs

# 4.6 Exponer puerto HTTP
EXPOSE ${PORT}

# 4.7 Comando de arranque (Next.js standalone)
CMD ["node", "server.js"]
