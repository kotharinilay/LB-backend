const axios = require('axios');
const cheerio = require('cheerio');
const {getDownload, walkDOM} = require('./utils');

const GENRE_URL = 'https://www.amazon.com/Pop/b/ref=dmm_hp_bbx_pop?ie=UTF8&node=625092011';

async function getTopTenPopSongs(genreUrl = GENRE_URL) {
  return axios
    .get(genreUrl)
    .then((response) => cheerio.load(response.data))
    .then(($) => {
      const ASINregex = /^\/dp\/([A-Z0-9]+)\//;

      let titlesAndThumb = $('.vxd-music-bs')
        .eq(0)
        .find('.vxd-music-bs-col-content img')
        .map((idx, el) => {
          const asin = ASINregex.exec(el.parent.attribs.href)[1];
          return {
            songTitle: el.attribs.alt,
            thumbnailSrc: el.attribs.src,
            downloadLink: getDownload(asin),
            asin
          };
        }).filter(Boolean);

      let topSongs = [];
      if (!titlesAndThumb['9']) {
        titlesAndThumb = titlesAndThumb.prevObject;
      }

      for (let i = 0; i < 10; i++) {
        topSongs.push(titlesAndThumb[`${i}`]);
      }

      const results = [];
      $('.vxd-music-bs')
        .eq(0)
        .find('.vxd-music-bs-col-content')
        .map((i, el) => {
          walkDOM(el, function(node) {
            if (node.type === 'tag') results.push(node);
          });
        });

      const titleArtistDict = results
        .map((el) => {
          if (
            el.attribs.class === 'a-truncate-full' &&
            el.children.length === 1 &&
            el.children[0].type === 'text'
          ) {
            return el.children[0].data.trim();
          }
        })
        .filter(Boolean)
        .reduce((acc, text, idx, srcArray) => {
          if (idx % 2 !== 0) {
            acc[srcArray[idx - 1]] = text;
          }
          return acc;
        }, {});

      for (let i = 0; i < topSongs.length; i++) {
        topSongs[i].songArtist = titleArtistDict[topSongs[i].songTitle];
      }

      return topSongs;
    });
}

module.exports = getTopTenPopSongs;