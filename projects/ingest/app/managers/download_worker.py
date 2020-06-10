#!/usr/bin/env python3

import os
import re
import subprocess
from os import listdir
from os.path import isfile, join
from threading import Thread

import youtube_dl


class DownloadWorker(Thread):
    def __init__(self, uri, user_id, uuid, game_name, streamer_name, upload_callback, send_message):
        Thread.__init__(self)
        self.uri = uri
        self.user_id = user_id
        self.uuid = uuid
        self.game_name = game_name
        self.streamer_name = streamer_name
        self.max_threads = 4
        self.upload_callback = upload_callback
        self.send_message = send_message
        self.prev_segment_files = []
        self.subprocess = None

    def stop(self):
        if self.subprocess is None:
            print("Process for %s doesn't exist" % self.uuid)
            pass
        else:
            self.subprocess.kill()
            print("Killed Process for %s" % self.uuid)

    def run(self):
        ydl_opts = {}
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            '''try:
                info_dict = ydl.extract_info(self.uri, download=False)
                video_url = info_dict.get("url", None)
            except:
                print("YoutubeDL Failed: Aborting")
                return'''
            video_url = self.uri
            playlist = '/tmp/segments/%s/index.m3u8' % self.uuid
            segment = '/tmp/segments/%s/%%d.ts' % self.uuid
            folder = os.path.dirname(playlist)
            if not os.path.exists(os.path.dirname(playlist)):
                os.makedirs(os.path.dirname(playlist))
            command = ['ffmpeg',
                       '-loglevel', 'fatal',
                       '-i', video_url,
                       '-threads', str(self.max_threads),
                       '-c:v', 'copy',
                       '-c:a', 'copy',
                       '-hls_segment_filename', segment,
                       playlist]

            self.subprocess = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                               universal_newlines=True)

            while True:
                self.upload_files(folder, playlist, self.subprocess)

                if self.subprocess.poll() is not None:
                    break

            rc = self.subprocess.poll()

    def upload_files(self, folder, playlist, process):
        segment_files = []
        for f in listdir(folder):
            if isfile(join(folder, f)):
                segment_files.append(join(folder, f))
        if playlist in segment_files:
            segment_files.remove(playlist)
        if (playlist + '.tmp') in segment_files:
            segment_files.remove((playlist + '.tmp'))
        dir = os.path.join('/proc/', str(process.pid), 'fd')
        if not os.access(dir, os.R_OK | os.X_OK):
            print("can't get dir")
            return False

        for fds in os.listdir(dir):
            for fd in fds:
                full_name = os.path.join(dir, fd)
                try:
                    file = os.readlink(full_name)
                    if file == '/dev/null' or \
                            re.match(r'pipe:\[\d+\]', file) or \
                            re.match(r'socket:\[\d+\]', file):
                        file = None
                except OSError as err:
                    if err.errno == 2:
                        file = None
                    else:
                        raise err
                if file:
                    if ".ts" in file:
                        if file in segment_files:
                            segment_files.remove(file)

        files_to_upload = []
        for f in segment_files:
            if f not in self.prev_segment_files:
                files_to_upload.append(f)
        self.prev_segment_files = segment_files
        self.upload_callback(self.user_id, files_to_upload, self.uuid, self.game_name, self.streamer_name)

        return True


if __name__ == "__main__":
    download_wkr = DownloadWorker("https://www.twitch.tv/tfue", "test")
    download_wkr.start()
