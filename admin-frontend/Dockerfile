# ── Stage 1: Build ──────────────────────────────────────────
FROM node:22-alpine as builder

WORKDIR /app

# Copy dependency manifests first (Docker layer cache optimisation)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build args for Vite env variables (injected at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL

# Vite inlines VITE_* env vars at build time, so we expose them here
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Production build
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────
FROM nginx:alpine

# Remove default Nginx site
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config (SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
