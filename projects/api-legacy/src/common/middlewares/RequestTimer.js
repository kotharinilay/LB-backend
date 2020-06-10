const dlv = require('dlv');
const cloudwatch = require('../../services/metrics/getCloudwatchInstance');
const SAMPLE_PERCENT = process.env.API_ENDPOINT_SAMPLE_PERCENT || 100;

const shouldExecute = (samplePercent) => {
  return Math.floor(Math.random() * 101) <= samplePercent;
};

function RequestTimer(label) {
  return function(req, res, next) {
    if (shouldExecute(SAMPLE_PERCENT)) {
      const startHrTime = process.hrtime();

      res.on('finish', () => {
        const elapsedHrTime = process.hrtime(startHrTime);

        const elapsedTimeInMs =
          elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;

        const endpointResponseMetric = getResponseTimeMetric(
          label || req.baseUrl,
          elapsedTimeInMs,
          req.method
        );

        cloudwatch.putMetricData(endpointResponseMetric, function(err, data) {
          if (err) {
            console.error(`Error measuring endpoint ${label || req.baseUrl}`);
            console.error(dlv(err, 'message', err));
          }
        });
      });
    }

    next();
  };
}

const getResponseTimeMetric = (endpoint, responseTimeMs, method) => ({
  MetricData: [
    {
      MetricName: 'API_ENDPOINT_RESPONSE_TIME_MS',
      Dimensions: [
        {
          Name: 'ENDPOINT_PATH',
          Value: `${endpoint}`
        },
        {
          Name: 'METHOD',
          Value: `${method}`
        }
      ],
      Unit: 'Milliseconds',
      Value: responseTimeMs
    }
  ],
  Namespace: 'BACKEND/API/'
});

module.exports = RequestTimer;
