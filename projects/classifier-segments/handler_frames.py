import json
import os
import boto3
import pika
import time
import shutil
import ntpath

s3 = boto3.resource('s3')
s3_client = boto3.client('s3')

SOURCE_BUCKET = os.environ['SRC_BUCKET']
DEST_BUCKET = os.environ['DEST_BUCKET']

def schedule_job(payload):
    payload = json.dumps(payload, ensure_ascii=False)

    credentials = pika.PlainCredentials('classifier', '3829382')
    parameters = pika.ConnectionParameters('172.27.37.148',
                                           5672,
                                           '/',
                                           credentials)
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()
    channel.exchange_declare(exchange='message', exchange_type='topic')
    channel.basic_publish(exchange='message', routing_key='classifier-east', body=payload)
    print('Sent %s to classifier-east' % (payload))
    connection.close()

def s3_upload_file(file_name, bucket, object_name):
    s3_client.upload_file(file_name, bucket, object_name)
    print("Uploaded %s" % file_name)

def extract_frames_from_ts(ffmpeg_path,
                           ts_file_path,
                           tmp_dir_path,
                           s3_bucket_name,
                           s3_bucket_path,
                           game_name,
                           uuid,
                           segment_number,
                           user_id,
                           streamer_name):

    ffmpeg_path = ffmpeg_path + " -nostdin -loglevel panic -y "

    # Extract frames
    ffmpeg_command = ffmpeg_path + "-i %s -vf fps=1 %s" % (ts_file_path, tmp_dir_path + "/Frame_%d.png")
    print("Extracting frames from %s" % ts_file_path)
    print("ffmpeg_command is %s" % ffmpeg_command)
    os.system(ffmpeg_command)

    # If frames extracted, upload them to S3
    total_files_uploaded = 0
    frames = []
    for filename in os.listdir(tmp_dir_path):
        file_path = "%s/%s" % (tmp_dir_path, filename)
        if filename.endswith(".png"):
            object_name = "%s/%s" % (s3_bucket_path, filename)
            s3_upload_file(file_path, s3_bucket_name, object_name)
            print("Uploaded %s to %s/%s" % (filename, s3_bucket_name, object_name))
            total_files_uploaded = total_files_uploaded + 1
            frames.append(object_name)
            continue
        else:
            continue

    print("uuid:", uuid)
    print("frames:", frames)
    print("user_id:", user_id)

    if total_files_uploaded > 0:
        schedule_job({
            "frames": frames,
            "game_name": game_name,
            "uuid": uuid,
            "user_id": user_id,
            "segment_number": segment_number,
            "streamer_name": streamer_name
        })

# Sample Payload

# {
#     user_id: 152,
#     game_name: "valorant",
#     segment_number: 7,
#     uuid: "ValorantTest",
#     streamer_name: "Roosevelt"
# }

def extract_frames(event, context):

    print("context", context)
    print("event", event)

    current_bucket = event["Records"][0]["s3"]["bucket"]["name"]
    uploaded_file = event["Records"][0]["s3"]["object"]

    if not uploaded_file:
        return response("Error: Object is Required")

    print("current_bucket", current_bucket)
    print("uploaded_file", uploaded_file)

    json_file_key = uploaded_file["key"]    

    # Download the File to the TMP Dir
    tmp_dir_path = "/tmp/%d" % (int(time.time()))
    json_file_path = "%s/%s" % (tmp_dir_path, ntpath.basename(json_file_key))

    print("tmp_dir_path", tmp_dir_path)
    print("json_file_path", json_file_path)

    if not os.path.exists(tmp_dir_path):
        os.makedirs(tmp_dir_path)

    s3.meta.client.download_file(current_bucket, json_file_key, json_file_path)
    print("Downloaded %s" % json_file_path)

    json_config = None
    with open(json_file_path) as json_file:
        json_config = json.load(json_file)
    print("json_config", json_config)

    segment_number = json_config["segment_number"]
    game_name = json_config["game_name"]
    uuid = json_config["uuid"]
    user_id = json_config["user_id"]
    streamer_name = json_config["streamer_name"]
    key = "media/streams/%s/%s.ts" % (uuid, segment_number)

    ts_file_path = "%s/%s.ts" % (tmp_dir_path, segment_number)

    print("segment_number", segment_number)
    print("game_name", game_name)
    print("uuid", uuid)

    s3.meta.client.download_file(current_bucket, key, ts_file_path)

    extract_frames_from_ts("/opt/python/ffmpeg",
                           ts_file_path,
                           tmp_dir_path,
                           DEST_BUCKET,
                           "classifier/%s/%s/Frames" % (uuid, segment_number),
                           game_name,
                           uuid,
                           segment_number,
                           user_id,
                           streamer_name)

    # Clean Up
    shutil.rmtree(tmp_dir_path)
    print("Deleted %s" % tmp_dir_path)

    return response("Successfully processed %s" % key)

def response(msg, code=200):
    body = {
        "message": msg
    }

    response = {
        "statusCode": code,
        "body": json.dumps(body)
    }

    return response