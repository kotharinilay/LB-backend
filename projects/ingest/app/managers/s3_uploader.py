#!/usr/bin/env python3

import ntpath
import os
import json

from threading import Thread

from botocore.exceptions import ClientError
import config

from pathlib import Path

class S3Uploader(Thread):
    def __init__(self, client_id, uuid, filename, folder, game_name, streamer_name, s3_client):
        Thread.__init__(self)
        self.filename = filename
        self.bucket = config.S3_BUCKET_NAME
        self.objectName = "media/streams/%s/%s" % (folder, ntpath.basename(self.filename))
        self.tsObjectName = "media/streams/%s/%s_json" % (folder, ntpath.basename(self.filename))
        self.s3_client = s3_client
        self.client_id = client_id
        self.uuid = uuid
        self.game_name = game_name
        self.streamer_name = streamer_name
        self.segment_number = int(Path(self.filename).stem)

    def run(self):
        
        object_name = ntpath.basename(self.filename)

        # Upload the file
        # s3_client = boto3.resource('s3')
        try:
            self.s3_client.Object(self.bucket, self.objectName).upload_file(Filename=self.filename)
            os.remove(self.filename)
            print("Uploaded %s" % self.filename)

            # Upload a JSON File
            ts_json = {
                "user_id": self.client_id,
                "game_name": self.game_name,
                "segment_number": self.segment_number,
                "uuid": self.uuid,
                "streamer_name": self.streamer_name
            }

            print("ts_json:", ts_json)

            self.s3_client.Object(self.bucket, self.tsObjectName).put(Body=(bytes(json.dumps(ts_json).encode('UTF-8'))))
            print("Uploaded %s" % self.tsObjectName)

        except ClientError as e:
            print(e)


if __name__ == "__main__":
    s3_uploader = S3Uploader(
        "/tmp/segments/6945f76c0cae11eabbd50242ac110003/6945f76c0cae11eabbd50242ac110003_0000.ts",
        "6945f76c0cae11eabbd50242ac110003"
    )
    s3_uploader.start()
