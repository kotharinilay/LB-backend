const moment = require('moment');

const NotFoundError = require('../../errors/NotFoundError');

const SocialReaction = require('../../models/socialReaction');
const SocialVideoReaction = require('../../models/SocialVideoReaction');
const SocialVideo = require('../../models/SocialVideo');
const SocialUserFollower = require('../../models/socialUserFollower');
const SocialTagFollower = require('../../models/socialTagFollower');
const SocialTag = require('../../models/socialTag');
const SocialVideoComment = require('../../models/SocialVideoComment');

const SocialVideoStatusEnum = require('../../common/enums/SocialVideoStatusEnum');
const SocialVideoReactionsEnum = require('../../common/enums/SocialVideoReactionsEnum');
const SocialTagStatusEnum = require('../../common/enums/SocialTagStatusEnum');
const SocialVideoCommentStatusEnum = require('../../common/enums/SocialVideoCommentStatusEnum');

class SocialService {

  async getFollowers(userId) {
    const results = await SocialUserFollower.getByUserId(userId);
    return results;
  } 

  async getAllVideos() {
    const results = await SocialVideo.getAllVideos();
    return results;
  }  

  async getVideoComments(socialVideoId) {
    const result = await SocialVideoComment.getBySocialVideoId(socialVideoId);
    return result;
  }
  
  async getCommentById(commentId) {
    const results = await SocialVideoComment.getByCommentId(commentId);
    return results;
  }

  async getBySocialVideoId(socialVideoId) {
    const results = await SocialVideo.getBySocialVideoId(socialVideoId);
    return results;
  }

  async getSocialTags(type) {
    const results = await SocialTag.getAll();
    return results;
  }

  async removeCommentFromVideo(userId,socialVideoCommentId) {
    const results = await SocialVideoComment.deleteByUserIdAndSocialVideoCommentId(userId,socialVideoCommentId);
    return results;
  }

  async addCommentToVideo(userId,socialVideoId,comment) {

    const results = await SocialVideoComment.create({
      social_video_id: socialVideoId,
      comment_user_id: userId,
      comment: comment,
      status: SocialVideoCommentStatusEnum.created
    });

    return results;

  }
  
  async updateCommentToVideo(userId,commentId,comment) {
    
    const results = await SocialVideoComment.updateByIdAndUserId(userId,commentId,comment);

    return results;

  }

  async unfollowTag(tagToUnfollow,userId) {

    const tagDetails = await SocialTag.getByTag(tagToUnfollow)

    console.log(tagDetails)

    if (!tagDetails) {
      return false;
    }

    const results = await SocialTagFollower.deleteByTagIdAndUserId(tagDetails['id'],userId);
    
    return results;
  }

  async followTag(tagToFollow,userId) {

    // find the tag id
    const results = await SocialTag.getByTag(tagToFollow)

    if (!results) {
      return false;
    }

    const social_tag_id = results['id']

    const tagFollowResults = await SocialTagFollower.create({
      tag_id: social_tag_id,
      user_id: userId
    });

    return tagFollowResults;
  }

  async unfollowUser(userId,followedByUserId) {
    const results = await SocialUserFollower.deleteByUserIDAndFollowedByUserId(userId,followedByUserId);
    return results;
  }

  async followUser(userToFollowUserId, followedByUserId) {
    const results = await SocialUserFollower.create({
      user_id: userToFollowUserId,
      followed_by_user_id: followedByUserId
    });
    return results;
  }

  async removeShare(userVideoId) {
    const results = await SocialVideo.deleteByUserVideoId(userVideoId);
    return results;
  }

  async shareAVideo(userVideoId) {
    const results = await SocialVideo.create({
      user_video_id: userVideoId,
      status: SocialVideoStatusEnum.created
    });
    return results;
  }

  async removeLike(userId, socialVideoId) {
    const results = await SocialVideoReaction.deleteByUserIdAndSocialVideoId(userId,socialVideoId);
    return results;
  }

  async likeAVideo(userId, socialVideoId) {
    const results = await SocialVideoReaction.create({
      social_reaction_id: SocialVideoReactionsEnum.like,
      social_video_id: socialVideoId,
      user_id: userId,
    });
    return results;
  }

  async getReactions() {
    const results = await SocialReaction.getAll();
    return results;
  }

  async addVideoReaction() {
    const results = await SocialEmoji.getAll();
    return results;
  }  

}

const instance = new SocialService();
module.exports = instance;