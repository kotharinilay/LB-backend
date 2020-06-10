import pika
import json
import os
import time
import ntpath
import shutil
import boto3
import numpy as np
import cv2
import math

from imutils.object_detection import non_max_suppression
from pathlib import Path

s3 = boto3.resource('s3')
s3_client = boto3.client('s3')

QUEUE_NAME = "classifier-east"
S3_BUCKET = "wizardlabs.gg-prod"

credentials = pika.PlainCredentials('wizardlabs', 
                                    'lk425@54sDDasd')

connection = pika.BlockingConnection(
        pika.ConnectionParameters('172.27.37.148', 5672, '/', credentials, heartbeat=600, blocked_connection_timeout=300)
)

channel = connection.channel()
channel.queue_declare(queue=QUEUE_NAME, durable=True, arguments={
    "x-queue-type": "classic"
})

# Load EAST Model
layerNames = [
    "feature_fusion/Conv_7/Sigmoid",
    "feature_fusion/concat_3"
]

net = cv2.dnn.readNet("./lib/frozen_east_text_detection.pb")
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_CUDA)
net.setPreferableTarget(cv2.dnn.DNN_TARGET_CUDA_FP16)

# Sample Payload

# {
#     "frames": [
#         "classifier/ValorantTest/7/Frames/Frame_2.png",
#         "classifier/ValorantTest/7/Frames/Frame_1.png"
#     ],
#     "game_name": "valorant",
#     "uuid": "ValorantTest",
#     "user_id": 152
# }

def decode(scores, geometry, scoreThresh):
    detections = []
    confidences = []

    ############ CHECK DIMENSIONS AND SHAPES OF geometry AND scores ############
    assert len(scores.shape) == 4, "Incorrect dimensions of scores"
    assert len(geometry.shape) == 4, "Incorrect dimensions of geometry"
    assert scores.shape[0] == 1, "Invalid dimensions of scores"
    assert geometry.shape[0] == 1, "Invalid dimensions of geometry"
    assert scores.shape[1] == 1, "Invalid dimensions of scores"
    assert geometry.shape[1] == 5, "Invalid dimensions of geometry"
    assert scores.shape[2] == geometry.shape[2], "Invalid dimensions of scores and geometry"
    assert scores.shape[3] == geometry.shape[3], "Invalid dimensions of scores and geometry"
    height = scores.shape[2]
    width = scores.shape[3]
    for y in range(0, height):

        # Extract data from scores
        scoresData = scores[0][0][y]
        x0_data = geometry[0][0][y]
        x1_data = geometry[0][1][y]
        x2_data = geometry[0][2][y]
        x3_data = geometry[0][3][y]
        anglesData = geometry[0][4][y]
        for x in range(0, width):
            score = scoresData[x]

            # If score is lower than threshold score, move to next x
            if(score < scoreThresh):
                continue

            # Calculate offset
            offsetX = x * 4.0
            offsetY = y * 4.0
            angle = anglesData[x]

            # Calculate cos and sin of angle
            cosA = math.cos(angle)
            sinA = math.sin(angle)
            h = x0_data[x] + x2_data[x]
            w = x1_data[x] + x3_data[x]

            # Calculate offset
            offset = ([offsetX + cosA * x1_data[x] + sinA * x2_data[x], offsetY - sinA * x1_data[x] + cosA * x2_data[x]])

            # Find points for rectangle
            p1 = (-sinA * h + offset[0], -cosA * h + offset[1])
            p3 = (-cosA * w + offset[0],  sinA * w + offset[1])
            center = (0.5*(p1[0]+p3[0]), 0.5*(p1[1]+p3[1]))
            detections.append((center, (w,h), -1*angle * 180.0 / math.pi))
            confidences.append(float(score))

    # Return detections and confidences
    return [detections, confidences]

def callback(ch, method, properties, body):

    start_time = time.time()

    # EAST

    confThreshold = 0.4
    nmsThreshold = 0.4
    inpWidth = 1280
    inpHeight = 1280

    payload = json.loads(body)

    print(" [] Started Processing:", payload)

    uuid = payload["uuid"]
    uuid = payload["uuid"]
    segment_number = payload["segment_number"]
    frames = payload["frames"]
    game_name = payload["game_name"]
    user_id = payload["user_id"]
    streamer_name = payload["streamer_name"]

    tmp_dir = "/tmp/%s" % (int(time.time()))
    print("tmp_dir", tmp_dir)

    if not os.path.exists(tmp_dir):
        os.makedirs(tmp_dir)

    json_payload = {}

    json_payload["uuid"] = uuid
    json_payload["segment_number"] = segment_number
    json_payload["game_name"] = game_name
    json_payload["user_id"] = user_id
    json_payload["streamer_name"] = streamer_name
    json_payload["frames"] = {}

    for frame_key in frames:

        frame_path = "%s/%s" % (tmp_dir, ntpath.basename(frame_key))
        print("frame_path", frame_path)

        # Download the Frame

        s3.meta.client.download_file(S3_BUCKET, frame_key, frame_path)
        print("Downloaded %s" % frame_path)

        # Find Text Boxes
        frame = cv2.imread(frame_path)

        height_ = frame.shape[0]
        width_ = frame.shape[1]

        json_payload["frames"][frame_key] = {}
        json_payload["frames"][frame_key]["width"] = width_
        json_payload["frames"][frame_key]["height"] = height_
        json_payload["frames"][frame_key]["textboxes"] = []
        
        rW = width_ / float(inpWidth)
        rH = height_ / float(inpHeight)

        # Create a 4D blob from frame.
        blob = cv2.dnn.blobFromImage(frame, 1.0, (inpWidth, inpHeight), (123.68, 116.78, 103.94), True, False)

        # Run the model
        net.setInput(blob)
        outs = net.forward(layerNames)
        t, _ = net.getPerfProfile()

        label = "East took: %.2f ms" % (t * 1000.0 / cv2.getTickFrequency())
        print(label)

        # Get scores and geometry
        scores = outs[0]
        geometry = outs[1]
        [boxes, confidences] = decode(scores, geometry, confThreshold)

        # Apply NMS
        indices = cv2.dnn.NMSBoxesRotated(boxes, confidences, confThreshold,nmsThreshold)

        text_boxes = []
        
        for i in indices:
            # get 4 corners of the rotated revt
            vertices = cv2.boxPoints(boxes[i[0]])
            # scale the bounding box coordinates based on the respective ratios
            for j in range(4):
                vertices[j][0] *= rW
                vertices[j][1] *= rH

            # print("vertices", vertices)

            # for j in range(4):
                
            pos_top_left = (vertices[1][0], vertices[1][1])
            pos_bottom_right = (vertices[3][0], vertices[3][1])

            pos_top_left_x = pos_top_left[0]
            pos_top_left_y = pos_top_left[1]

            pos_bottom_right_x = pos_bottom_right[0]
            pos_bottom_right_y = pos_bottom_right[1]

            pos_top_left_x_norm = pos_top_left_x / width_
            pos_top_left_y_norm = pos_top_left_y / height_

            pos_bottom_right_x_norm = pos_bottom_right_x / width_
            pos_bottom_right_y_norm = pos_bottom_right_y / height_

            if game_name == "fortnite":

                if pos_top_left_x_norm < 0.25:
                    continue

                if pos_top_left_y_norm < 0.05:
                    continue

                if pos_bottom_right_x_norm > 0.80:
                    continue

                if pos_bottom_right_y_norm > .90:
                    continue

            # todo: filter out valorant boxes
            # todo: filter out warzone boxes

            # print("pos_top_left_x_norm: %s, pos_top_left_y_norm: %s, pos_bottom_right_x_norm: %s, pos_bottom_right_y_norm: %s" % (
            #     pos_top_left_x_norm, pos_top_left_y_norm, pos_bottom_right_x_norm, pos_bottom_right_y_norm
            # ))
            
            # frame = cv2.rectangle(frame, pos_top_left, pos_bottom_right, (0,255,0), 2)

            text_boxes.append([pos_top_left, pos_bottom_right])

        # cv2.putText(frame, label, (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        # cv2.imwrite("test_%s" % ntpath.basename(frame_key), frame)            

        # Crop Text Boxes

        print("text_boxes_len", len(text_boxes))
        # print("text_boxes", text_boxes)

        text_box_num = 0
        for text_box in text_boxes:
            print("text_box", text_box)
            
            text_box_path = "%s/%s_Text_%s.png" % (tmp_dir, Path(frame_key).stem, text_box_num)
            text_box_key = "classifier/%s/%s/TextBoxes/%s" % (uuid, segment_number, ntpath.basename(text_box_path))
            
            cropped = frame[
                int(text_box[0][1]):int(text_box[1][1]), 
                int(text_box[0][0]):int(text_box[1][0])
            ]

            # print("cropped:", cropped)
            # print("len(cropped):", len(cropped))

            # print("text_box[0][1]", text_box[0][1])
            # print("text_box[1][1]", text_box[1][1])
            # print("text_box[0][0]", text_box[0][0])
            # print("text_box[1][0]", text_box[1][0])

            try:
                cv2.imwrite(text_box_path, cropped)
                s3_client.upload_file(text_box_path, S3_BUCKET, text_box_key)
                print("Uploaded %s" % text_box_key)

                json_payload["frames"][frame_key]["textboxes"].append({
                    "text_box_key": text_box_key,
                    "detection_coordinates": {
                        "top_left_x": int(text_box[0][0]),
                        "top_left_y": int(text_box[0][1]),
                        "bottom_right_x": int(text_box[1][0]),
                        "bottom_right_y": int(text_box[1][1]),
                    }
                })

                text_box_num = text_box_num + 1
            except cv2.error as e:
                print("cv2.error:", e)

    print("json_payload", json_payload)

    json_local_file = "%s/TextBoxes_%s.json" % (tmp_dir, segment_number)

    with open(json_local_file, 'w') as outfile:
        json.dump(json_payload, outfile)

    # Upload JSON File to S3
    json_file_key = "classifier/%s/%s/TextBoxes_%s.ocr_json" % (uuid, segment_number, segment_number)
    
    s3_client.upload_file(json_local_file, S3_BUCKET, json_file_key)
    print("Uploaded %s" % json_file_key)

    # Clean Up
    
    shutil.rmtree(tmp_dir)
    print("Removed %s" % tmp_dir)
    
    print(" [] Finished Processing in %s seconds" % (time.time() - start_time))

    ch.basic_ack(delivery_tag=method.delivery_tag)

# channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)

print(' [] Waiting for messages. To exit press CTRL+C')

channel.start_consuming()