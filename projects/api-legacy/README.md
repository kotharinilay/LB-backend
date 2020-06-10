# Wizard Api
_This README file contains service-specific information_

## Build
### Regular
```shell script
docker build . -f projects/api/Dockerfile --build-arg PROJECT_PATH=./projects/api \
  -t 160492786134.dkr.ecr.us-east-2.amazonaws.com/wizard/api:latest \
  -t wizard-api:latest --no-cache

```

### Custom youtube-dl
In case we need to add a custom youtube-dl we can build it this way
```shell script
docker build . -f projects/api/Dockerfile --build-arg PROJECT_PATH=./projects/api \
  --build-arg YOUTUBE_DL_URL="https://youtube-dl.org/downloads/latest/youtube-dl" \
  -t 160492786134.dkr.ecr.us-east-2.amazonaws.com/wizard/api:latest \
  -t wizard-api:latest --no-cache
```
If it becomes a long term, please modify Makefile to add the argument permanently.

 

