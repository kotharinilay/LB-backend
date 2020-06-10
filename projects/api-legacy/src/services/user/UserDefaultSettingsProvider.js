const CAPTURE_DELAY_BEFORE_DEFAULT_VALUE = 5;
const CAPTURE_DELAY_AFTER_DEFAULT_VALUE = 5;

function getDefault() {
  return {
    captureDelayBefore: CAPTURE_DELAY_BEFORE_DEFAULT_VALUE,
    captureDelayAfter: CAPTURE_DELAY_AFTER_DEFAULT_VALUE
  };
}

module.exports = {
  getDefault: getDefault
};
