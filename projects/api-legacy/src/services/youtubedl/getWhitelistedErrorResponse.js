// These are known error messages returned from the youtube-dl, from
// both the youtube and twitch extractors
const whitelistedFailures = [
  {
    errString: 'HTTP Error 403: Forbidden',
    errResponse: 'This video might be for paid subscribers of this channel'
  },
  {
    errString: 'is offline',
    errResponse: 'This stream has ended'
  },
  {
    errString: 'This video is DRM protected',
    errResponse: 'This video is DRM protected'
  },
  {
    errString: 'ERROR: This video is unavailable.\n',
    errResponse: 'This video no longer exists'
  },
  {
    errString: 'Invalid URL',
    errResponse: 'Invalid URL passed'
  },
  {
    errString: 'Incomplete YouTube ID',
    errResponse: 'Invalid YouTube ID (seems truncated)'
  },
  {
    errString: 'This clip is no longer available',
    errResponse: 'This clip is no longer available'
  },
];

module.exports = function getWhitelistedErrorResponse(errorMessage) {
  for (let i = 0; i < whitelistedFailures.length; i++) {
    if (errorMessage.indexOf(whitelistedFailures[i].errString) > 0) {
      return whitelistedFailures[i].errResponse;
    }
  }
};
