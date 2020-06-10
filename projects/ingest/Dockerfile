FROM python:3.7-alpine3.10

ARG PROJECT_PATH=.
ENV \
  PORT=3000 \
  WORKERS=4


WORKDIR /app
RUN apk add --no-cache \
  ffmpeg \
  && \
  pip3 install pipenv

#RUN apt-get update && apt-get install -y ffmpeg python3 python3-pip locales vim

#RUN locale-gen "en_US.UTF-8"
#
#RUN export LC_ALL="en_US.UTF-8"

#RUN pip3 install wheel

#RUN pip3 install --upgrade pika youtube_dl boto3 uwsgi flask requests psutil datadog ddtrace
COPY ${PROJECT_PATH}/Pipfile* ./
RUN set -ex && \
    apk add --no-cache --virtual .build-deps build-base linux-headers python3-dev musl-dev && \
    pipenv install --deploy --system && \
    apk del .build-deps


COPY ${PROJECT_PATH}/app ./app
COPY ${PROJECT_PATH}/config.py ./
COPY ${PROJECT_PATH}/docker-entrypoint.sh ./

#COPY ${PROJECT_PATH}/config/aws/* /root/.aws/

#RUN uwsgi --build-plugin https://github.com/Datadog/uwsgi-dogstatsd

CMD ["/app/docker-entrypoint.sh"]

EXPOSE $PORT
