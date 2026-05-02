# syntax=docker/dockerfile:1
# Build static assets (Vite), serve with nginx:alpine (~minimal runtime)
FROM node:22-alpine AS builder
WORKDIR /app

# Baked at build time for Vite
ARG VITE_API_URL=http://localhost:3000
ARG VITE_ONESIGNAL_APP_ID=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ONESIGNAL_APP_ID=$VITE_ONESIGNAL_APP_ID

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY index.html vite.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build && rm -rf node_modules

FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
