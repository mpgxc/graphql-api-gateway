FROM node:20-alpine as build-stage

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

RUN npm run build

FROM node:20-alpine as production-stage

WORKDIR /app

COPY package*.json ./

RUN npm i --omit=dev

COPY --from=build-stage /app/dist ./dist
