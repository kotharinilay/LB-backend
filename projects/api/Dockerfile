FROM node:12-alpine as builder

ARG PROJECT_PATH=.
ENV PORT=3000

RUN apk add --no-cache \
    python3 \
    bash \
    curl \
  && \
    ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY ${PROJECT_PATH}/package*.json ./
COPY ${PROJECT_PATH}/tsconfig*.json ./
COPY ${PROJECT_PATH}/src ./src

RUN \
  npm i && \
  npm ci

RUN npx tsc --build tsconfig.json

EXPOSE $PORT

CMD ["npm", "start"]
