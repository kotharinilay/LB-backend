#!/bin/bash

docker run --gpus all \
		   -it \
		   -v $(pwd)/source:/usr/src/app \
		   -p 9000:9000 \
		   --name=wizard_classifier_dev \
		   wizard/classifier-python3 \
		   bash
