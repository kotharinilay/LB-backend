const axios = require('axios');
const dlv = require('dlv');

class InstagramCrawlerService {
  /**
   * Parse Instagram page of given user
   * @param userName - Instagram user name
   * @returns {Promise<void>} Array of data about latest posts
   */
  async parse(userName) {
    return axios.get(`https://www.instagram.com/${userName}/?__a=1`)
      .then((response) => {
        const data = response.data;
        const posts = dlv(data, 'graphql.user.edge_owner_to_timeline_media.edges', []);

        return posts.map((post) => {
          const node = post.node;
          return {
            id: node.id,
            timestamp: node.taken_at_timestamp,
            likeCount: dlv(node, 'edge_liked_by.count', 0),
            viewCount: node.video_view_count || 0,
            isVideo: node.is_video
          }
        });
      })
      .catch((error) => {
        console.error(
          'Error occurred while getting info about user page from Instagram',
          error
        );
        return [];
      });
  }
}

const instance = new InstagramCrawlerService();
module.exports = instance;
