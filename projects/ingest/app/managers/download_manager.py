#!/usr/bin/env python3

import time
from queue import Queue
from threading import Thread

from app.managers.download_worker import DownloadWorker


class DownloadManager(Thread):
    def __init__(self, upload_callback, send_message):
        Thread.__init__(self)
        self.work_queue = Queue()
        self.done = False
        self.upload_callback = upload_callback
        self.send_message = send_message
        self.workers = {}

    def run(self):
        while not self.done:
            if self.work_queue.empty():
                time.sleep(1)
            else:
                current_job = self.work_queue.get()
                self.workers[current_job.uuid].start()

    def add_job(self, uri, user_id, uuid, game_name, streamer_name):
        job = DownloadWorker(uri, user_id, uuid, game_name, streamer_name, self.upload_callback, self.send_message)
        self.workers[uuid] = job
        self.work_queue.put(job)

    def pika_callback(self, body):
        job_request = body
        if not self.validate_json(job_request):
            return False
        if job_request['action'] == 'start':
            print("Added Start Job for %s" % job_request)
            self.add_job(job_request['uri'], job_request['client_id'], job_request['uuid'], job_request['game_name'], job_request['streamer_name'])
        if job_request['action'] == 'stop':
            print("Trying to Stop Job for %s" % job_request)
            self.stop_stream(job_request['uuid'])
        return True

    def stop_stream(self, uuid):
        print("UUID: %s" % uuid)
        print(self.workers.keys())
        if uuid in self.workers.keys():
            self.workers[uuid].stop()
            del self.workers[uuid]

    def validate_json(self, job_request):
        if 'action' not in job_request:
            print("action missing from request, aborting")
            return False
        if 'uri' not in job_request:
            print("uri missing from request, aborting")
            return False
        if 'client_id' not in job_request:
            print("client_id missing from request, aborting")
            return False
        if 'uuid' not in job_request:
            print("uuid missing from request, aborting")
            return False
        return True
