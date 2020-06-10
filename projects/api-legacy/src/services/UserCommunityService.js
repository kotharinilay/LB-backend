const moment = require('moment');

const NotFoundError = require('../errors/NotFoundError');
const UserCommunity = require('../models/userCommunity');
const UserCommunityMember = require('../models/userCommunityMember');
const UserCommunityVideo = require('../models/userCommunityVideo');

class UserCommunityService {

  async getStreamers(userId,communityId) {
    const community = await UserCommunity.getStreamersByCommunityId(userId,communityId);
    return community;
  }

  async getUserCommunity(userId, communityId) {
    const community = await getCommunity(userId, communityId);
    return buildCommunityResponseModel(community);
  }

  async getUserCommunities(userId, fields, pagingSorting) {
    const communities = await UserCommunity.getAllByUserId(userId);
    if (communities.length === 0) {
      return [];
    }

    let communitiesModels;
    let pagination = {};
    if (fields && fields.includes('videos')) {
      const communityIds = communities.map((community) => community.id);

      const {
        data,
        pagination: pagingObject
      } = await UserCommunityVideo.getAllByCommunityIds(
        communityIds,
        pagingSorting
      );

      // A little hacky, I know
      pagination = pagingObject;

      const communityIdToVideosMap = convertVideosArrayToMap(data);

      communitiesModels = communities.map((community) => {
        return buildCommunityResponseModel(community,
          communityIdToVideosMap.get(community.id) || []
        );
      });
    } else {
      communitiesModels = communities.map(
        (community) => buildCommunityResponseModel(community)
      );
    }

    return {data: communitiesModels, pagination};
  }

  /**
   * Check if user already member of community
   * @param userId - User Id to check membership
   * @param communityId - Community Id
   * @returns {Promise<*|XPromise<any>>} Promise that contain result of checking:
   * true - if already member, otherwise - false
   */
  async checkUserCommunityMembership(userId, communityId) {
    return UserCommunityMember.existsByUserIdAndCommunityId(userId,
      communityId);
  }
}

/**
 * Get a specific community's information that the user belongs to.
 * If the return is empty, either the community doesn't exist or the
 * user is not a member.
 *
 * @param {number} userId Unique user id
 * @param {number} communityId Unique community id
 * @return {Object} Information about specific community requested
 * @throws {NotFoundError}
 */
async function getCommunity(userId, communityId) {
  const community = await UserCommunity.getByIdAndUserId(userId, communityId);

  if (!community) {
    console.error(
      `Community with Id '${communityId}' not found for user '${userId}'`
    );
    throw new NotFoundError('Cannot find community');
  }

  return community;
}

/**
 * Given a raw database response representing a community, grab the fields
 * the client will be interested and return those only.
 *
 * @param {Object} community Raw response from the DB containing information on a community
 * @return {Object}
 */
function buildCommunityResponseModel(community, videos) {
  const result = {
    id: community.id,
    name: community.name,
    description: community.description,
    logo: community.logo_url,
    tags: community.tags,
    socialChannels: buildSocialChannels(community.social),
    membersCount: 0,
    postsCount: 0,
    viewsCount: 0,
    followersCount: 0
  };
  completeCommunityModelWithVideosData(result, videos);

  return result;
}

function completeCommunityModelWithVideosData(community, videos) {
  if (!Array.isArray(videos)) {
    return;
  }

  community.videos = videos.map((video) => buildVideoResponseModel(video));
}

function buildVideoResponseModel(video) {
  return {
    id: video.id,
    name: video.name,
    url: video.url,
    thumbnailUrl: video.thumbnail_url,
    createdDate: moment.utc(video.created_date).format(),
    streamerName: video.streamer_name
  };
}

function convertVideosArrayToMap(videos) {
  const result = new Map();

  videos.forEach((video) => {
    const communityId = video.community_id;
    const videosList = result.get(communityId);

    if (!videosList) {
      result.set(
        communityId,
        [video]
      );
    } else {
      videosList.push(video);
    }
  });

  return result;
}

function buildSocialChannels(social) {
  if (!social) {
    return [];
  }

  return Object.keys(social).map((key) => {
    const url = social[key];

    return {
      providerType: key,
      url: url
    };
  });
}

const instance = new UserCommunityService();
module.exports = instance;