FROM node:24-alpine AS build

# Copy source code
COPY . /src/openeo-web-editor
WORKDIR /src/openeo-web-editor

# Build
RUN npm install
RUN npm run build

# Copy build folder and serve it with Caddy (as non-root user)
FROM caddy:2-alpine

COPY --from=build /src/openeo-web-editor/dist /usr/share/openeo-web-editor
COPY docker/Caddyfile /etc/caddy/Caddyfile

# Port inside the container. Docker (20.10+) and containerd (2.0+) allow non-root users to bind ports below 1024.
# On other container runtimes, set it to a port above 1023, e.g. 8080.
ENV PORT=80
EXPOSE 80

USER 101
