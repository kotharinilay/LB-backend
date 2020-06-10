#!/usr/bin/env python3

import time
from queue import Queue
from threading import Thread

import boto3

from app.managers.s3_uploader import S3Uploader


class S3Manager(Thread):
    def __init__(self):
        Thread.__init__(self)

        self.work_queue = Queue()
        self.done = False
        self.s3_client = boto3.resource('s3')

    def run(self):
        while not self.done:
            if self.work_queue.empty():
                time.sleep(1)
            else:
                job = self.work_queue.get()
                job.start()

    def add_file_list(self, client_id, file_list, uuid, game_name, streamer_name):
        for file in file_list:
            job = S3Uploader(client_id, uuid, file, uuid, game_name, streamer_name, self.s3_client)
            self.work_queue.put(job)
