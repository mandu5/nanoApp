# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app

# Allow injecting backend URL for CRA build at build time
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci || npm install
COPY . .
# Ensure the environment variable is present during build for CRA
RUN REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL} npm run build

# Stage 2: serve
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
