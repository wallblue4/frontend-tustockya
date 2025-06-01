# frontend/Dockerfile

FROM node:18-alpine as builder

WORKDIR /app

COPY package.json package-lock.json ./
# O si usas npm: COPY package.json package-lock.json ./

RUN npm install --legacy-peer-deps
# O si usas npm: RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build
# O si usas npm: RUN npm run build


FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

