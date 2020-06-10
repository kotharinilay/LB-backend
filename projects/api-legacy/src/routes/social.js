const express = require('express');
const router = express.Router({mergeParams: true});
const moment = require('moment');

const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const {authFilter}= require('../common/middlewares/AuthFilter');
const RequestTimer = require('../common/middlewares/RequestTimer');
const {validateFieldsParameter} = require('../common/middlewares/FieldsQueryParameterValidator');
const NotFoundError = require('../errors/NotFoundError');
const SocialService = require('../services/social/SocialService');
const SuccessResponse = require('../common/SuccessResponse');
const {buildPagingSorting} = require('../common/PagingSorting');
const UserVideo = require('../models/userVideo');

router.use(authFilter);

router.get(
  '/',
  validateFieldsParameter,
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const fields = req.query.fields;
    const pagingSorting = buildPagingSorting(req.query);

    const {data, pagination} = await SocialService.getUserCommunities(
      userId,
      fields,
      pagingSorting
    );

    const responseBody = new SuccessResponse({
      pagination,
      data
    }).build();
    res.json(responseBody);
  })
);

router.get(
  '/followers/:userId',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {

    const userId = req.params.userId;
    
    result = await SocialService.getFollowers(userId);

    if (!result) {
      console.error(
        `Could not find any followers`
      );
      next(new Error('Error finding followers'));
      return;
    }

    const responseBody = new SuccessResponse(result).build();

    res.json(responseBody);
  })
);

router.get(
  '/videos/id/:socialVideoId',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {

    const socialVideoId = req.params.socialVideoId;
    
    result = await SocialService.getBySocialVideoId(socialVideoId);

    if (!result) {
      console.error(
        `Could not find the video`
      );
      next(new Error('Error finding video'));
      return;
    }

    const responseBody = new SuccessResponse(result).build();

    res.json(responseBody);
  })
);

router.get(
  '/videos/all',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    const userId = req.userId;
    const pagingSorting = buildPagingSorting(req.query);
    const {data: videosPaginated, pagination} = await UserVideo.getAllVideos(
      pagingSorting,
      userId
    );

    const videos = videosPaginated.map((video) =>
      buildVideoResponseModel(video)
    );

    const responseBody = new SuccessResponse({
      pagination,
      data: videos
    }).build();

    res.json(responseBody);

  })
);

router.get(
  '/tags',
  RequestTimer('/api/v1/social/tags'),
  AsyncMiddleware(async (req, res) => {
    
    const tags = await SocialService.getSocialTags();

    const responseBody = new SuccessResponse(tags).build();
    
    res.json(responseBody);
  })
);

router.get(
  '/reactions',
  RequestTimer('/api/v1/social/reactions'),
  AsyncMiddleware(async (req, res) => {
    
    const reactions = await SocialService.getReactions();

    const responseBody = new SuccessResponse(reactions).build();
    
    res.json(responseBody);
  })
);

router.post(
  '/tags/follow/:tagToFollow',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    const tagToFollow = req.params.tagToFollow;
    const userId = req.userId;

    tag_follow_id = await SocialService.followTag(tagToFollow,userId);

    if (!tag_follow_id) {
      console.error(
        `Couldn't follow the tag`
      );
      next(new Error('Error following the tag'));
      return;
    }

    const responseBody = new SuccessResponse({
      message: `Successfully followed the tag`,
      tagFollowId: tag_follow_id
    }).build();

    res.json(responseBody);
  })
);

router.post(
  '/videos/:socialVideoId/comment/:socialVideoCommentId/remove',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    const socialVideoCommentId = req.params.socialVideoCommentId;
    const userId = req.userId;

    result = await SocialService.removeCommentFromVideo(userId,socialVideoCommentId);

    if (result != null) {
      console.error(
        `Couldn't remove the comment`
      );
      next(new Error('Error removing a comment'));
      return;
    }

    const responseBody = new SuccessResponse({
      message: `Successfully removed the comment`
    }).build();

    res.json(responseBody);
  })
);

router.put(
  '/videos/:socialVideoId/comment/:socialVideoCommentId',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    const userId = req.userId;
    const comment = req.body["comment"];
    const commentId = req.params.socialVideoCommentId;

    if (!comment) {
      console.error(
        `Comment is required`
      );
      next(new Error('Error: Comment is required'));
      return;
    }

    result = await SocialService.updateCommentToVideo(userId,commentId,comment);

    if (!result) {
      console.error(
        `Couldn't post a comment`
      );
      next(new Error('Error posting a comment to a social video'));
      return;
    }

    commentData = await SocialService.getCommentById(commentId);

    const responseBody = new SuccessResponse({
      message: `Successfully posted the comment`,
      data: commentData
    }).build();

    res.json(responseBody);

  })
);

router.get(
  '/videos/:socialVideoId/comments',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    const socialVideoId = req.params.socialVideoId;

    result = await SocialService.getVideoComments(socialVideoId);

    if (!result) {
      console.error(
        `Couldn't find any comments`
      );
      next(new Error('Error loading comments from a video'));
      return;
    }

    const responseBody = new SuccessResponse(result).build();

    res.json(responseBody);
  })
);

router.post(
  '/videos/:socialVideoId/comment',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    const socialVideoId = req.params.socialVideoId;
    const userId = req.userId;
    const comment = req.body["comment"]

    if (!comment) {
      console.error(
        `Comment is required`
      );
      next(new Error('Error: Comment is required'));
      return;
    }

    result = await SocialService.addCommentToVideo(userId,socialVideoId,comment);

    if (!result) {
      console.error(
        `Couldn't post a comment`
      );
      next(new Error('Error posting a comment to a social video'));
      return;
    }

    commentData = await SocialService.getCommentById(result);

    const responseBody = new SuccessResponse({
      message: `Successfully posted the comment`,
      data: commentData
    }).build();

    res.json(responseBody);
  })
);

router.post(
  '/tags/follow/:tagToFollow',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    const tagToFollow = req.params.tagToFollow;
    const userId = req.userId;

    tag_follow_id = await SocialService.followTag(tagToFollow,userId);

    if (!tag_follow_id) {
      console.error(
        `Couldn't follow the tag`
      );
      next(new Error('Error following the tag'));
      return;
    }

    const responseBody = new SuccessResponse({
      message: `Successfully followed the tag`,
      tagFollowId: tag_follow_id
    }).build();

    res.json(responseBody);
  })
);

router.post(
  '/tags/follow/:tagToUnfollow/remove',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    const tagToUnfollow = req.params.tagToUnfollow;
    const userId = req.userId;

    result = await SocialService.unfollowTag(tagToUnfollow,userId);

    if (result != null) {
      console.error(
        `Couldn't unfollow the tag`
      );
      next(new Error('Error unfollowing the tag'));
      return;
    }

    const responseBody = new SuccessResponse({
      message: `Successfully unfollowed the tag`
    }).build();

    res.json(responseBody);
  })
);

router.post(
  '/follow/:userIdToFollow',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    const userIdToFollow = req.params.userIdToFollow;
    const followedByUserId = req.userId;

    follow_id = await SocialService.followUser(userIdToFollow,followedByUserId);

    if (!follow_id) {
      console.error(
        `Couldn't follow the user`
      );
      next(new Error('Error following a user'));
      return;
    }

    const responseBody = new SuccessResponse({
      message: `Successfully followed the user`,
      followId: follow_id
    }).build();

    res.json(responseBody);
  })
);

router.post(
  '/follow/:userIdToUnfollow/remove',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    const userIdToUnfollow = req.params.userIdToUnfollow;
    const followedByUserId = req.userId;

    result = await SocialService.unfollowUser(userIdToUnfollow,followedByUserId);

    if (result != null) {
      console.error(
        `Couldn't unfollow the user`
      );
      next(new Error('Error unfollowing a user'));
      return;
    }

    const responseBody = new SuccessResponse({
      message: `Successfully unfollowed the user`
    }).build();

    res.json(responseBody);
  })
);

router.post(
  '/like/:socialVideoId',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    const userId = req.userId;
    const socialVideoId = req.params.socialVideoId;

    like_id = await SocialService.likeAVideo(userId, socialVideoId);

    if (!like_id) {
      console.error(
        `Couldn't like the video`
      );
      next(new Error('Error liking a video'));
      return;
    }

    const responseBody = new SuccessResponse({
      message: `Successfully liked the social video`,
      likeId: like_id
    }).build();

    res.json(responseBody);
  })
);

router.post(
  '/like/:socialVideoId/remove',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    const userId = req.userId;
    const socialVideoId = req.params.socialVideoId;

    result = await SocialService.removeLike(userId, socialVideoId);

    if (result != null) {
      console.error(
        `Couldn't remove like from the video`
      );
      next(new Error('Error removing a like'));
      return;
    }

    const responseBody = new SuccessResponse({
      message: `Successfully removed like from the social video`
    }).build();

    res.json(responseBody);
  })
);

router.post(
  '/share/:userVideoId',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {

    // todo: Make sure the User Video ID is valid
    // todo: Make sure the user video belongs to the user
    
    const userId = req.userId;
    const socialVideoId = req.params.socialVideoId;

    share_id = await SocialService.shareAVideo(userId, socialVideoId);

    if (!share_id) {
      console.error(
        `Couldn't share the video to the community`
      );
      next(new Error('Error liking a video'));
      return;
    }

    const responseBody = new SuccessResponse({
      message: `Successfully shared the video to the community`,
      shareId: share_id
    }).build();

    res.json(responseBody);
  })
);

router.post(
  '/share/:userVideoId/remove',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {

    // todo: Make sure the User Video ID is valid
    // todo: Make sure the user video belongs to the user
    
    const userId = req.userId;
    const socialVideoId = req.params.socialVideoId;

    result = await SocialService.removeShare(userId, socialVideoId);

    if (result != null) {
      console.error(
        `Couldn't remove the video from the community`
      );
      next(new Error('Error removing the shared video'));
      return;
    }

    const responseBody = new SuccessResponse({
      message: `Successfully removed the video from the community`
    }).build();

    res.json(responseBody);
  })
);

/**
 * Generates string token
 * @returns {string} Token
 */
function generateToken() {
  return Math.random().toString(36).substring(2, 15);
}

function buildVideoResponseModel(video) {
  const result = {
    id: video.id,
    name: video.name,
    tags: video.tags,
    url: video.url,
    thumbnailUrl: video.thumbnail_url,
    type: video.type,
    createdDate: moment.utc(video.created_date).format(),
    streamerName: video.streamer_name,
    gameMode: video.game_mode,
    streamDate: video.stream_date,
    likeCount: video.like_count
  };

  result.metadata = {};

  if (video.metadata && video.metadata.duration) {
    result.metadata.duration = video.metadata.duration;
  }
  
  if (video.metadata && video.metadata.resolution) {
    result.metadata.resolution = video.metadata.resolution;
  }

  if (video.user_id) {
    result.owner = {
      id: video.user_id,
      name: video.user_name
    }
  }

  if(video.like_status){
    result.likeStatus = true;
  }else{
    result.likeStatus = false;
  }

  result.comments = [];

  let comment_ids = [];
  let commentCount = 0;
  
  video.comments.map(function(comment){
    if(comment["f1"] && !comment_ids.includes(comment["f1"]) && comment_ids.length < 3 ){

      let temp = {
        "social_video_comment_id": comment["f1"],
        "social_video_id": comment["f2"],
        "comment_user_id": comment["f4"],
        "comment": comment["f5"],
        "created_date": comment["f6"],
        "name": comment["f14"],
        "user_name": comment["f18"],
        "avatar": comment["f19"] ? comment["f19"]["url"] : null
      }

      result.comments.push(temp);
      comment_ids.push(comment["f1"]);
      commentCount = commentCount + 1;

    }else if(comment["f1"] && !comment_ids.includes(comment["f1"])){


      commentCount = commentCount + 1;

    }
    
  })  

  if(commentCount > 3){

    result.moreComments = true;

  }else{

    result.moreComments = false;
    
  }


  return result;
}

module.exports = router;
