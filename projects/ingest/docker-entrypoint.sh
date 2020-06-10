#!/usr/bin/env sh
gunicorn --name ${APP_NAME:-defaultapp} --statsd-host "localhost:8125" -b 0.0.0.0:${PORT:-3000} --workers ${WORKERS:-1} app:app
