import cv2
import pytesseract
import re
import time
import os
import boto3
import json
import ntpath

from fuzzywuzzy import fuzz

s3 = boto3.resource('s3')
s3_client = boto3.client('s3')

SOURCE_BUCKET = os.environ['SRC_BUCKET']
DEST_BUCKET = os.environ['DEST_BUCKET']
CLIPPER_BUCKET = os.environ['CLIPPER_BUCKET']

def get_events(event, context):

    print("event", event)
    print("context", context)

    current_bucket = event["Records"][0]["s3"]["bucket"]["name"]
    uploaded_file = event["Records"][0]["s3"]["object"]

    if not uploaded_file:
        return response("Error: Object is Required")

    print("current_bucket", current_bucket)
    print("uploaded_file", uploaded_file)

    key = uploaded_file["key"]

    tmp_dir_path = "/tmp/%d" % (int(time.time()))

    json_file_path = "%s/file.json" % tmp_dir_path

    print("tmp_dir_path", tmp_dir_path)
    print("json_file_path", json_file_path)

    if not os.path.exists(tmp_dir_path):
        os.makedirs(tmp_dir_path)

    s3.meta.client.download_file(current_bucket, key, json_file_path)

    json_config = None

    with open(json_file_path) as json_file:
        json_config = json.load(json_file)
        print("json_config", json_config)

    user_id = json_config["user_id"]
    uuid = json_config["uuid"]
    segment_number = json_config["segment_number"]
    game_name = json_config["game_name"]
    streamer_name = json_config["streamer_name"]
    frames = json_config["frames"]

    total_events = 0
    events_detected = {}

    for index in frames.keys():

        frame_details = frames[index]
        frame_width = frame_details["width"]
        frame_height = frame_details["height"]

        for textbox in frame_details["textboxes"]:
            
            text_box_key = textbox["text_box_key"]
            
            detection_coordinates = textbox["detection_coordinates"]
            
            top_left_x = detection_coordinates["top_left_x"]
            top_left_y = detection_coordinates["top_left_y"]
            bottom_right_x = detection_coordinates["bottom_right_x"]
            bottom_right_y = detection_coordinates["bottom_right_y"]

            frame_number = int(ntpath.basename(text_box_key).split("_")[1])

            # Download the Text Box
            text_box_path = "%s/%s" % (tmp_dir_path, ntpath.basename(text_box_key))

            s3.meta.client.download_file(current_bucket, text_box_key, text_box_path)
            print("Downloaded %s" % text_box_path)

            # Get OCR
            events = get_events_from_img(game_name, text_box_path)
            
            if frame_number in events_detected:
                events_detected[frame_number].extend(events)
            else:
                events_detected[frame_number] = []
                events_detected[frame_number].extend(events)

            if len(events) > 0:
                total_events = total_events + 1

    print("events_detected", events_detected)
    print("total_events", total_events)

    if total_events > 0:

        event_second = min(events_detected.keys())
        print("event_second:", event_second)

        frame_payload = []

        for frame_number in events_detected.keys():
            frame_events = events_detected[frame_number]
            frame_events_obj = []
            for frame_event in frame_events:
                frame_events_obj.append({
                    "label": frame_event
                })
            frame_payload.append(frame_events_obj)

        clipper_payload = {
            "clientID": str(user_id),
            "client_id": str(user_id),
            "event_second": event_second,
            "frame": frame_payload,
            "gameName": game_name,
            "hasEvent": 1,
            "segmentUri": "media/streams/%s/%s.ts" % (uuid, segment_number),
            "status": "start",
            "streamerName": streamer_name,
            "uuid": uuid
        }

        print("clipper_payload:", clipper_payload)

        clipper_json_file = "%s/Clip_%s_%s_%s.json" % (tmp_dir_path, uuid, user_id, segment_number)

        with open(clipper_json_file, 'w') as outfile:
            json.dump(clipper_payload, outfile)

        # Upload JSON File to S3
        json_file_key = "Clip_%s_%s_%s.json" % (uuid, user_id, segment_number)
        
        s3_client.upload_file(clipper_json_file, CLIPPER_BUCKET, json_file_key)
        print("Uploaded %s" % json_file_key)

    return response("Successfully processed all the text boxes.")

def get_events_from_img(game_name, image_text_box_path):

    key_events = [
        "death",
        "kill",
        "victory",
        "knocked",
        "loss"
    ]

    game_event_keywords = {
        "fortnite": {
            "death": [
                "youplaced"
            ],
            "knocked": [
                "knocked"
            ],
            "victory": [
                "victory",
                "royale"
            ],
            "kill": [
                "eliminated"
            ],
            "loss": [
                "youplaced"
            ]
        },
        "valorant": {
            "death": [
                "lost"
            ],
            "kill": [
                "headshot"
            ],
            "victory": [
                "won"
            ],
            "loss": [
                "lost"
            ]
        },
        "warzone": {
            "death": [
                "killedby"
            ],
            "kill": [
                "headshot",
                "eliminated",
                "killconfirmed",
                "pointblank",
                "assaultriflekills",
                "bloodthirsty",
                "teamwiped",
                "doublekill",
                "oneshotonekill",
                "longshot",
                "unstoppable"
            ],
            "victory": [
                "won",
                "victory",
                "roundwin"
            ],
            "knocked": [
                "downed"
            ],
            "loss": [
                "lost",
                "loss"
            ]
        }
    }

    if game_name not in game_event_keywords.keys():
        return False

    # Load the Image as OpenCV
    opencv_image = cv2.imread(image_text_box_path)

    ocr_text = get_ocr_from_img(opencv_image)

    print("ocr_text", ocr_text)

    events_found = []

    for key_event in key_events:
        if key_event in game_event_keywords[game_name]:
            keywords = game_event_keywords[game_name][key_event]
            for keyword in keywords:
                ratio = fuzz.ratio(keyword, ocr_text)
                print("Ratio of %s and %s is %s" % (keyword, ocr_text, ratio))
                if ratio > 90:
                    print("Found a %s%% match with %s and %s" % (ratio, keyword, ocr_text))
                    events_found.append(key_event)

    return list(set(events_found))

def get_ocr_from_img(cv_image):

    gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
    ret, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_OTSU)
    ret, inverted = cv2.threshold(thresh, 127, 255, cv2.THRESH_BINARY_INV)
    config = '--oem {} --psm {} -l {}'.format(1, 3, "eng")

    ocr_text = pytesseract.image_to_string(inverted, config=config)
    ocr_text = ocr_text.encode('ascii', 'ignore')
    ocr_text = ocr_text.decode("utf-8")
    ocr_text = ocr_text.lower()

    regex = re.compile("[^a-z]")

    ocr_text = regex.sub('', ocr_text)

    return ocr_text

def response(msg, code=200):
    body = {
        "message": msg
    }

    response = {
        "statusCode": code,
        "body": json.dumps(body)
    }

    return response