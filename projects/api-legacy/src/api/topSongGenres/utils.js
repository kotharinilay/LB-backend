function getDownload(asin) {
  return `https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=${asin}&DownloadLocation=WEBSITE`;
}

function walkDOM(node, cb) {
  cb(node);
  node = node.firstChild;
  while (node) {
    walkDOM(node, cb);
    node = node.nextSibling;
  }
}

module.exports = {
  getDownload,
  walkDOM
};