FROM node:22-alpine AS build

# Copy source code
COPY . /src/openeo-web-editor
WORKDIR /src/openeo-web-editor

# Build
RUN npm install
RUN npm run build

# Copy build folder and run with nginx
FROM nginx:1.28.0-alpine
COPY --from=build /src/openeo-web-editor/dist /usr/share/nginx/html
