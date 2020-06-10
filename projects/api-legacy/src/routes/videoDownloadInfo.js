const express = require('express');
/* global -Promise */
const Promise = require('bluebird');
const youtubeDL = require('youtube-dl');
const validator = require('validator');
const moment = require('moment');
const url = require('url');
const dlv = require('dlv');
const router = express.Router();

const {authFilter} = require('../common/middlewares/AuthFilter');
const ProvidersEnum = require('../common/enums/ProvidersEnum');
const BadRequestError = require('../errors/BadRequestError');
const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const SuccessResponse = require('../common/SuccessResponse');
const MeasureYoutubeDL = require('../services/metrics/youtubeDL');
const getWhitelistedErrorResponse = require('../services/youtubedl/getWhitelistedErrorResponse');
const RequestTimer = require('../common/middlewares/RequestTimer')
const FileStorageFacade = require('../services/storage/FileStorageFacade');
const EmailSenderService = require('../services/email/EmailSenderService');
const fs = require('fs');
const MixerService = require('../services/social/MixerService');
const path = require('path');
const AWS_S3_YOUTUBE_MP3_BUCKET = process.env.AWS_S3_YOUTUBE_MP3_BUCKET;
const MEDIA_MP3_PATH = "https://"+AWS_S3_YOUTUBE_MP3_BUCKET+".s3-us-west-2.amazonaws.com/";


router.use(authFilter);

router.get(
  '/',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    const error = validateRequest(req);

    if (error) {
      return next(error);
    }

    let url = dlv(req, 'query.source');

    if (!url) {
      return next(new BadRequestError());
    }

    // First, validate the URL and see if it's missing the protocol
    // If it is, then we assume HTTPS and prepend it to the url
    if (url.match(/^(www|twitch|youtube|instagram|mixer)/)) {
      url = 'https://' + url;
    }

    if (url.match(/(mixer)/)) {
      var recordingId = url.match(/[0-9]+/gm)

      const payload = await MixerService.getByRecordingId(recordingId);

      res.json(new SuccessResponse(payload).build());

      return;
    }

    try {
      const payload = await MeasureYoutubeDL(getVideoDownloadUrl, url);

      res.json(new SuccessResponse(payload).build());
    } catch (err) {
      // Log error details to Cloudwatch
      console.error(`Cannot get video info with url: ${url}`, err);

      // youtube-dl will put the human readable error message on the `stderr` key
      if (dlv(err, 'stderr')) {
        const validError = getWhitelistedErrorResponse(err.stderr);

        // We've got a known error here that we don't consider a failure,
        // things such as the video being for paid subscribers or the video
        // not existing anymore
        if (validError) {
          return res.status(403).send(validError);
        }

        // We've got an actual error going on with youtube-dl here, log the actual
        // error to cloudwatch and send something generic to client
        console.error(err.stderr);
        return res
          .status(403)
          .send('Something went wrong attempting to grab the video, sorry');
      }

      // A generic error has occured outside of youtube-dl
      next(err);
    }
  })
);


router.get(
  '/media',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    const error = validateMediaRequest(req);

    if (error) {
      return next(error);
    }

    let url = dlv(req, 'query.source');
    const type = req.query.type;
    const email = req.query.email;
    
    if (!url) {
      return next(new BadRequestError());
    }

    let params;


    res.json(new SuccessResponse({}).build());

    if(type === "mp3"){

      params = ['-x','-f','best','--audio-format', 'mp3', '-o', './src/public/%(id)s.%(ext)s'];

      youtubeDL.exec(url, params, {}, async (err, info) => {
        if (err) {
          console.log(err)
          EmailSenderService.onMediaRequested(email, "mp3", null, false)

        }else{


        console.log(info)
  
        const localFilePath = info[3].replace("[ffmpeg] Destination: ./src/public/","");
        const fileContent = fs.readFileSync(path.join(__dirname,"../" + info[3].replace("[ffmpeg] Destination: ./src/","")));
  
        let {url} = await FileStorageFacade.uploadMp3(
          localFilePath, fileContent
        );

        EmailSenderService.onMediaRequested(email, "mp3", url, true);

        }
        
      });

    }else{

      params = ['-f','best','-o', './src/public/%(id)s.%(ext)s'];

      youtubeDL.exec(url, params, {}, async (err, info) => {
        if (err) {
          console.log(err);

          EmailSenderService.onMediaRequested(email, "video", url, false)

        }else{

          console.log(info)
  
          const localFilePath = info[1].replace("[download] Destination: ./src/public/","");
          const fileContent = fs.readFileSync(path.join(__dirname,"../" + info[1].replace("[download] Destination: ./src/","")));
    
          let {url} = await FileStorageFacade.uploadMp3(
            localFilePath, fileContent
          );

          EmailSenderService.onMediaRequested(email, "video", url, true)
          

        }
        
      });
    }
  })
);

function validateRequest(req) {
  const url = req.query.source;
  if (!url) {
    console.error(`source value missing`);
    return new BadRequestError(`url value missing`);
  }

  if (!validator.isURL(url)) {
    console.error(`url value passed is invalid: ${url}`);
    return new BadRequestError('url is invalid');
  }
}

function validateMediaRequest(req) {
  const url = req.query.source;
  if (!url) {
    console.error(`source value missing`);
    return new BadRequestError(`url value missing`);
  }

  if (!validator.isURL(url)) {
    console.error(`url value passed is invalid: ${url}`);
    return new BadRequestError('url is invalid');
  }

  const email = req.query.email;
  if (!email) {
    console.error(`email value missing`);
    return new BadRequestError(`email value missing`);
  }
}

async function getVideoDownloadUrl(url) {
  return new Promise((resolve, reject) => {
    youtubeDL.getInfo(url, [], (err, info) => {
      if (err) {
        return reject(err);
      }

      if (!dlv(info, 'extractor')) {
        console.error('No extractor found in return: ' + JSON.stringify(info));
        // attempt to set the provider type based on host value of URL
        const extractor = getProviderTypeFromUrl(url);
        if (!extractor) {
          return reject(new Error('Something went wrong, not able to get the providerType'));
        }

        info.extractor = extractor;
      }

      const responseObject = buildResponseObject(info);
      resolve(responseObject);
    });
  });
}

function buildResponseObject(data) {
  const providerType = data.extractor.indexOf(':') ?
    data.extractor.split(':')[0]
    :
    data.extractor;

  const {
    thumbnail,
    duration,
    description,
    upload_date,
    id,
    title,
    url,
    formats,
    webpage_url,
    is_live,
    uploader
  } = data;

  const playbackUrls = getFormats(formats, providerType, is_live);
  const dateOfTheStream = moment(upload_date).format();

  return {
    id,
    thumbnailUrl: thumbnail,
    duration,
    description,
    publishedDate: dateOfTheStream,
    streamDate: dateOfTheStream,
    title,
    providerType,
    url,
    webpageUrl: webpage_url,
    playbackUrls,
    streamerName: uploader,
    isLive: is_live
  };
}

function getFormats(formats, providerType, isLive) {
  // Strip out non-playable youtube formats (we want MP4)
  // for VODs
  if (providerType === 'youtube' && !isLive) {
    formats = formats.filter(
      (format) => format.url.indexOf('mime=video%2Fmp4') > -1
    );
  }

  return formats.map((format) => ({
    protocol: format.protocol,
    format: format.format,
    manifest_url: format.manifest_url,
    url: format.url,
    height: format.height,
    width: format.width
  }));
}

function getProviderTypeFromUrl(requestedUrl) {
  const parsed = url.parse(requestedUrl);
  const providerType = parsed.host.split('.')[0];
  if (ProvidersEnum.hasKey(providerType.toLowerCase())) {
    return providerType.toLowerCase();
  }
}

module.exports = router;
