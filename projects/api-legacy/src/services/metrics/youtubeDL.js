const dlv = require('dlv');
const url = require('url');
const cloudWatch = require('./getCloudwatchInstance');
const getWhitelistedErrorResponse = require('../youtubedl/getWhitelistedErrorResponse');

module.exports = async function measureYoutubeDLExecutionTime(
  command,
  commandUrl
) {
  const hrstart = process.hrtime();
  let success = true;
  let output, youtubeDLError;
  try {
    output = await command(commandUrl);
  } catch (err) {
    // Check that the error isn't on a the whitelist of acceptable
    // errors we receive from youtube-dl, like the video not being live
    // or it not existing, etc.
    if (dlv(err, 'stderr') && !getWhitelistedErrorResponse(err.stderr)) {
      success = false;
    }

    youtubeDLError = err;
  }

  const executionTime = process.hrtime(hrstart);

  const failOrSuccessMetric = getFailOrSuccessMetric(success, commandUrl);
  const executionTimeMetric = getExecutionTimeMetric(
    commandUrl,
    success,
    executionTime
  );

  let promises = [];

  promises.push(new Promise((resolve, reject) => {
    cloudWatch.putMetricData(executionTimeMetric, function(err, data) {
      if (err) {
        // Log error but continue on with application logic
        console.error('error setting YOUTUBE_DL_EXECUTION_TIME metric', err);
      }

      resolve();
    });
  }));

  promises.push(new Promise((resolve, reject) => {
    cloudWatch.putMetricData(failOrSuccessMetric, function(err, data) {
      if (err) {
        // Log error but continue on with application logic
        console.error('error setting YOUTUBE_DL_CALL_STATUS metric', err);
      }
      resolve();
    });
  }));

  return Promise.all(promises).then(() => {
    if (youtubeDLError) {
      throw youtubeDLError;
    }

    return output;
  });
};

function getSeconds(hrTime) {
  return (hrTime[0] * 1e9 + hrTime[1]) / 1e9;
}

function getProviderType(urlString) {
  const parsed = url.parse(urlString);
  let hostname = parsed.hostname.split('.');
  if (hostname[1] === 'com') {
    return hostname[0];
  }
  return hostname[1];
}

/**
 * Crafts a a pass/fail metric payload to send to
 * cloudwatch about about the call
 *
 * @param {Boolean} didSucceed if the command succeeded
 * @param {String} commandUrl the URL of the video we attempted
 */
function getFailOrSuccessMetric(didSucceed, commandUrl) {
  let commandStatus = didSucceed ? 'succeed' : 'fail';
  return {
    MetricData: [
      {
        MetricName: 'YOUTUBE_DL_EXECUTION_CALL_STATUS',
        Dimensions: [
          {
            Name: 'API_ENDPOINT',
            Value: 'VIDEOSOURCE'
          },
          {
            Name: 'PROVIDER_TYPE',
            Value: getProviderType(commandUrl)
          },
          {
            Name: 'COMMAND_STATUS',
            Value: `${commandStatus}` 
          }
        ],
        Unit: 'Count',
        Value: 1
      }
    ],
    Namespace: 'BACKEND/API/'
  };
}

/**
 * Crafts a payload for cloudwatch custom metric to track the execution time
 * in seconds of the youtube-dl execution times - pass, fail, and what providers.
 *
 * @param {String} commandUrl the URL of the video we attempted to process
 * @param {Boolean} success whether the call executed without an error
 * @param {Process.hrTime} executionTime execution time of the call 
 */
function getExecutionTimeMetric(commandUrl, success, executionTime) {
  const successValue = success ? 'succeed' : 'fail';
  return {
    MetricData: [
      {
        MetricName: 'YOUTUBE_DL_EXECUTION_TIME',
        Dimensions: [
          {
            Name: 'API_ENDPOINT',
            Value: 'VIDEOSOURCE'
          },
          {
            Name: 'PROVIDER_TYPE',
            Value: getProviderType(commandUrl)
          },
          {
            Name: 'COMMAND_SUCCEEDED',
            Value: `${successValue}`
          }
        ],
        Unit: 'Seconds',
        Value: getSeconds(executionTime)
      }
    ],
    Namespace: 'BACKEND/API/'
  };
}