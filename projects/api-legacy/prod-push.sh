#!/bin/bash

sudo $(aws ecr get-login --no-include-email --region us-east-2)
sudo docker build -t wizardlabs_api_prod -f Dockerfile .
sudo docker tag wizardlabs_api_prod:latest 160492786134.dkr.ecr.us-east-2.amazonaws.com/wizard/api:latest
sudo docker push 160492786134.dkr.ecr.us-east-2.amazonaws.com/wizard/api:latest