#!/bin/bash

sudo $(aws ecr get-login --no-include-email --region us-east-2)

./prod-build.sh

sudo docker tag wizard/classifier-python3:latest 160492786134.dkr.ecr.us-east-2.amazonaws.com/wizard/classifier-python3:latest

sudo docker push 160492786134.dkr.ecr.us-east-2.amazonaws.com/wizard/classifier-python3:latest