#!/usr/bin/env python3
import json

import datadog
import ddtrace
import requests
from flask import Flask
from flask import request

from app.managers.download_manager import DownloadManager
from app.managers.s3_manager import S3Manager
import logging

import config

def add_file(client_id, file_list, uuid, game_name, streamer_name):
    if s3_manager:
        s3_manager.add_file_list(client_id, file_list, uuid, game_name, streamer_name)


def send_message(status, fileUri, client_id, uuid, game_name, streamer_name):
    message = {}
    message['status'] = status
    message['segmentUri'] = fileUri
    message['client_id'] = client_id
    message['uuid'] = uuid
    message['game_name'] = game_name
    message['streamer_name'] = streamer_name

    print("Payload", message)

    # post_request = requests.post(url="%s/classifier".format(), data=message)
    # if post_request.ok:
    #     print("Successfully posted %s to the Classifier RMQ" % message)
    # else:
    #     print("Error: Could not post %s to the Classifier RMQ" % message)


app = Flask(__name__)
app.config.from_object(config)

# Keep stdout/stderr logging using StreamHandler
streamHandler = logging.StreamHandler()
app.logger.addHandler(streamHandler)
app.logger.setLevel(logging.INFO)
# apply same formatter on all log handlers
for logHandler in app.logger.handlers:
    logHandler.setFormatter(logging.Formatter('[%(asctime)s] %(levelname)s %(name)s %(threadName)s: %(message)s'))

# Initialize Datadog StatsD
datadog_options = {
    'statsd_host': config.DD_STATSD_HOST,
    'statsd_port': config.DD_STATSD_PORT
}

ddtrace.config.flask['extra_error_codes'] = [401, 403]
ddtrace.patch_all()
datadog.initialize(**datadog_options)

s3_manager = S3Manager()

download_manager = DownloadManager(add_file, send_message)

app.logger.info("Starting Download Manager")
download_manager.start()

app.logger.info("Starting S3 Manager")
s3_manager.start()

app.logger.info("Starting Flask")


def verify_token():
    if not request.headers.get("Authorization"):
        return False
    authorization_token_header = request.headers.get("Authorization")
    if not authorization_token_header.startswith("Basic "):
        return False
    authorization_token = authorization_token_header.replace("Basic ", "").strip()
    if authorization_token != config.APP_TOKEN:
        return False
    return True


@app.route("/")
def index():
    return "Never let a computer know you're in a hurry..."


@app.route("/api/v1/ingest", methods=['POST'])
def ingest_job():
    resp = {}
    print("Trying to verify token")
    if not verify_token():
        resp['success'] = False
        resp['msg'] = "Forbidden"
        return json.dumps(resp), 403, {'Content-Type': 'application/json'}
    if download_manager:
        json_data = request.get_json()
        print(json_data)
        result = download_manager.pika_callback(json_data)
        if result:
            resp['success'] = True
            resp['msg'] = "Successfully scheduled the %s job for %s." % (json_data["action"], json_data["uuid"])
            datadog.statsd.increment("wizard.ingest." + json_data["action"])
        else:
            resp['success'] = False
            resp['msg'] = "Error: Unable to schedule the %s job for %s." % (json_data["action"], json_data["uuid"])
    return json.dumps(resp), 200, {'Content-Type': 'application/json'}


@app.route("/api/health")
def health():
    # TODO: Add better integration testing, to output the following JSON object:
    #  { "awsConnected": true, "AMQPConsumerConnected": true, "AMQPProducerConnected: true }
    return "OK"
