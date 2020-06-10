#!/bin/bash

docker run --gpus all \
		   -it \
		   -p 9000:9000 \
		   --name=wizard_classifier_prod \
		   wizard/classifier-python3
