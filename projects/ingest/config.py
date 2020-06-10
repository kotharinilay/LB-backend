import os

APP_NAME = 'ingest'
ENV_PREFIX = f'{ APP_NAME.upper().replace("-", "_") }_'
DEBUG = bool(os.getenv(ENV_PREFIX + 'DEBUG', False))
S3_BUCKET_NAME = os.getenv(ENV_PREFIX + 'S3_BUCKET_NAME', 'wizardlabs.gg-prod')
WIZARD_API = os.getenv(ENV_PREFIX + 'WIZARD_API', 'https://d-api.wizardlabs.gg/api/v1')
APP_TOKEN = os.getenv(ENV_PREFIX + 'APP_TOKEN', 'a4fe1d8d8b164c7b9ccdd49b287d9332')
AMQP_CONSUMER_URL = os.getenv(ENV_PREFIX + 'AMQP_CONSUMER_URL', 'amqp://wizardlabs:lk425%4054sDDasd@172.27.37.148:5672/%2F?connection_attempts=3&heartbeat=0')
AMQP_PRODUCER_URL = os.getenv(ENV_PREFIX + 'AMQP_PRODUCER_URL', 'amqp://wizardlabs:lk425%4054sDDasd@172.27.37.148:5672/%2F?connection_attempts=3&heartbeat=0')
PORT = int(os.getenv(ENV_PREFIX + 'PORT', 3000))
DD_STATSD_HOST = os.getenv(ENV_PREFIX + 'DD_STATSD_HOST', '127.0.0.1')
DD_STATSD_PORT = int(os.getenv(ENV_PREFIX + 'DD_STATSD_PORT', 8125))
