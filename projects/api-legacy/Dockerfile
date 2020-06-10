#TODO <@AutomationD>: Switch to multistage build
FROM node:12-alpine as builder

ENV CHROME_BIN="/usr/bin/chromium-browser"\
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

# This is used to have ability to build project from the root of the repo and from the project dir
ARG PROJECT_PATH=.

# This parameter can be used for non-official youtube-dl binaries.
# Just pass it as build argument to docker build, like this: `--build-arg YOUTUBE_DL_URL="https://youtube-dl.org/downloads/latest/youtube-dl"`
ARG YOUTUBE_DL_URL="https://youtube-dl-binary.s3-us-west-1.amazonaws.com/2020-06-04-youtube-dl"

# TODO <@AutomationD>: Is this still in use? (Why do we have ingest service?)
# Python is a dependency for youtube-dl to work
RUN apk add --no-cache \
    python3 \
    bash \
    curl \
    ffmpeg \
    nss \
    chromium \
    make \
    zip \
  && \
    ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ${PROJECT_PATH}/package*.json ./

# If you are building your code for production
RUN \
  npm i && \
  npm ci --only=production

# Bundle app source
COPY ${PROJECT_PATH}/src ./src
COPY ${PROJECT_PATH}/bin ./bin

# Download youtube-dl if the YOUTUBE_DL_URL build argument is provided, don't do anything if it's empty.
RUN \
  if [ -n "$YOUTUBE_DL_URL" ]; then \
    ls -la /app/node_modules/youtube-dl/bin/ && \
    curl "$YOUTUBE_DL_URL" -o /app/node_modules/youtube-dl/bin/youtube-dl && \
    chmod +x /app/node_modules/youtube-dl/bin/youtube-dl; \
  fi




# TODO <@AutomationD>: Use standard port for consistency (IE: 3000)
EXPOSE 8080

CMD ["npm", "start"]
