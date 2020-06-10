# backend

This powers our backend API. It's currently a node.js express app that running on a single CPU (not clustered) in EC2.

Here's some API routes/calls that are used to power the iOS client that I'm auditing, trying to remove un-used functionality so that the move to serverless is easy.

# Cinematics

## Initiate a Push Button Cinematic Request

`POST /api/v1/cinematics/auto`

Payload:

```
{
    "userId": 151,
    "clipId": 8472
}
```



Returns

```
{
    "status": "ok",
    "payload": {
        "message": "Successfully saved the video entry",
        "cinematicId": 12
    }
}
```

## Add a New Entry to the DB

`POST /api/v1/cinematics/new`

Payload:

```
{
    "userId": 151,
    "clipId": 8472,
    "videoUrl": "https://cloudmedia.wizardlabs.gg/cinematics/userId_clipId_randomHex.mp4",
    "thumbUrl": "https://cloudmedia.wizardlabs.gg/cinematics/userId_clipId_randomHex.jpg",
    "package": "https://cloudmedia.wizardlabs.gg/cinematics/userId_clipId_randomHex.zip"
}
```

Returns

```
{
    "status": "ok",
    "payload": {
        "message": "Successfully saved the video entry",
        "cinematicId": 12
    }
}
```

## Get Cinematic Videos By User ID

`GET /api/v1/cinematics/videos/:userId`

Example: /api/v1/cinematics/videos/152

Returns

```
{
    "status": "ok",
    "payload": [
        {
            "id": 7,
            "user_id": 152,
            "video_url": "https://cloudmedia.wizardlabs.gg/cinematics/userId_randomHex.mp4",
            "thumb_url": "https://cloudmedia.wizardlabs.gg/cinematics/userId_randomHex.jpg",
            "created": "2020-05-12 03:45:36"
        },
        {
            "id": 8,
            "user_id": 152,
            "video_url": "https://cloudmedia.wizardlabs.gg/cinematics/userId_randomHex.mp4",
            "thumb_url": "https://cloudmedia.wizardlabs.gg/cinematics/userId_randomHex.jpg",
            "created": "2020-05-12 03:45:39"
        },
        {
            "id": 9,
            "user_id": 152,
            "video_url": "https://cloudmedia.wizardlabs.gg/cinematics/userId_randomHex.mp4",
            "thumb_url": "https://cloudmedia.wizardlabs.gg/cinematics/userId_randomHex.jpg",
            "created": "2020-05-12 03:45:40"
        }
    ]
}
```

## Get AUTO Clips for Cinematics using Basic Auth

`GET /api/v1/cinematics/clips`

## Process a Cinematic Clip & Frame using Basic Auth

`POST /api/v1/cinematics/process`

Sample Payload:

form-data

```
clipFrameFile
userId
clipId
cinematicKeyframeNumber
```

## Delete a Cinematic Video Using Basic Auth

`/api/v1/cinematics/videos/:cinematicVideoId`

# Stream Chat APIs

## Twitch

### Get Chat From Live Stream

`GET /api/v1/providers/channels/twitch/chat/live/:twitchUserName`

Example: /api/v1/providers/channels/twitch/chat/live/nickeh30

Returns

```
[16:09:06] shadow_bops: it gets darker when they start coming
[16:09:08] xxyungbloodxx69: @xx6ixgodxx3 hes prob gunna keep playing in alittke
[16:09:10] diffk: LULU
[16:09:10] relx_my_guy: oh my lord
[16:09:10] ponpononyouxd: Loool
[16:09:11] diffk: LUL
```

### Get Chat Log from Saved Videos

`GET /api/v1/providers/channels/twitch/chat/:twitchVideoId`

Example: /api/v1/providers/channels/twitch/chat/604137978

Returns

```
{
    "status": "ok",
    "payload": {
        "file": "https://cloudmedia.wizardlabs.gg/chat/twitch/604137978.txt"
    }
}
```

# Community Endpoints

## Get Video Comments

TODO: Add paging, etc.

`GET /api/v1/social/videos/:socialVideoId/comments`

Returns

```
{
    "status": "ok",
    "payload": [
        {
            "social_video_id": 1,
            "social_video_comment_id": 4,
            "comment_user_id": 152,
            "comment": "This is awesome!",
            "created_date": "2020-04-23 06:56:32",
            "name": null,
            "user_name": "roosevelt",
            "avatar": null
        },
        {
            "social_video_id": 1,
            "social_video_comment_id": 5,
            "comment_user_id": 153,
            "comment": "Roosevelt is a beast!",
            "created_date": "2020-04-23 06:56:47",
            "name": null,
            "user_name": "razerx",
            "avatar": null
        }
        ...
    ]
}
```

## Get a List of Followers

`GET /api/v1/social/followers/:userId`

TODO: Add paging, etc.

Returns

```
{
    "status": "ok",
    "payload": [
        {
            "user_id": 152,
            "name": null,
            "user_name": "roosevelt",
            "avatar": null
        },
        {
            "user_id": 146,
            "name": null,
            "user_name": "Foobar",
            "avatar": {
                "url": "https://wizardlabs-userdata.s3-us-east-2.amazonaws.com/user/avatar/i6hitfc8iasaub7k0tzvan.png",
                "path": "user/avatar/i6hitfc8iasaub7k0tzvan.png"
            }
        }
    ]
}
```

## Get a List of User Videos Shared with the Community

TODO: Add filters by tag, user id, paging, etc.

`GET /api/v1/social/videos/all`

Returns

```
{
    "status": "ok",
    "payload": [
        {
            "name": "Prospering Got a Kill! Fortnite 03/18/2020 07:29",
            "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/oq9h2uh4e98r5aa0o8msc.mp4",
            "thumbnail_url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/c02h2xn5kxl5qwpcisplop.jpg",
            "metadata": {
                "size": 2326786,
                "duration": 8
            },
            "user_id": 169,
            "created_date": "2020-03-18 19:29:44"
        }
        ...
    ]
}
```

## Get a Specific User Video Shared With the Community

`GET /api/v1/social/videos/id/:socialVideoId`

Returns

```
{
    "status": "ok",
    "payload": {
        "social_video_id": 9,
        "name": "ICEBR_Evan Got a Kill!",
        "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/r7vr48bhw0f5jw8v0zaedt.mp4",
        "thumbnail_url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/wyk5q0do1amxwrlkhihc5.jpg",
        "metadata": {
            "size": 4852738
        },
        "user_id": 161,
        "created_date": "2020-03-24 02:48:17"
    }
}
```

## Follow a Tag

`POST /api/v1/social/tags/follow/eliminated`

Returns

```
{
    "status": "ok",
    "payload": {
        "message": "Successfully followed the tag",
        "tagFollowId": 7
    }
}
```

## Unfollow a Tag

`/api/v1/social/tags/follow/eliminated/remove`

```
{
    "status": "ok",
    "payload": {
        "message": "Successfully unfollowed the tag"
    }
}
```

## Follow a User

`POST /api/v1/social/follow/:userIdToFollow`

Returns

```
{
    "status": "ok",
    "payload": {
        "message": "Successfully followed the user",
        "followId": 1
    }
}
```

## Unfollow a User

`POST /api/v1/social/follow/:userIdToUnfollow/remove`

Returns

```
{
    "status": "ok",
    "payload": {
        "message": "Successfully unfollowed the user"
    }
}
```

## Share a User Video to the Community

`POST /api/v1/social/share/:userVideoId`

Returns

```
{
    "status": "ok",
    "payload": {
        "message": "Successfully shared the video to the community",
        "shareId": 2
    }
}
```

## Remove a Shared Video from the Community

`POST /api/v1/social/share/:userVideoId/remove`

```
{
    "status": "ok",
    "payload": {
        "message": "Successfully removed the video from the community"
    }
}
```

## Get a List of Reactions (Like, Angry, Wow, etc.)

* Currently, we are only adding the option to like a video or to like a comment. So, it returns only 1 entry.

`GET /api/v1/social/reactions`

Returns

```
{
    "status": "ok",
    "payload": [
        {
            "id": 1,
            "reaction": "like"
        }
    ]
}
```

## Liking a Video

`POST /api/v1/social/like/:social_video_id`

Returns

```
{
    "status": "ok",
    "payload": {
        "message": "Successfully liked the social video",
        "likeId": 1
    }
}
```

Error Checking. An user cannot like the same video twice.

```
{
    "status": "error",
    "payload": {
        "message": "Something went wrong",
        "description": "duplicate key value violates unique constraint \"social_video_reactions_social_video_id_user_id_key\""
    }
}
```

## Removing a Like

`POST /api/v1/social/like/:social_video_id/remove`

Returns

```
{
    "status": "ok",
    "payload": {
        "message": "Successfully removed like from the social video"
    }
}
```

## Adding a Comment to a Video

`POST /api/v1/social/videos/1/comment`

Payload

```
{
  "comment": "This is my comment!"
}
```

Returns

```
{
    "status": "ok",
    "payload": {
        "message": "Successfully posted the comment"
    }
}
```

## Removing a Comment from a Video

`POST /api/v1/social/videos/:socialVideoId/comment/:socialVideoCommentId/remove`

Returns

```
{
    "status": "ok",
    "payload": {
        "message": "Successfully removed the comment"
    }
}
```

## Liking a Video Comment

TODO

## Get Trending Social Tags

TODO

# Paging/Sorting directions
Certain endpoints that can return a ton of data have support for pagination.
For any endpoints related to clips and videos, they'll follow this pattern to do paging and sorting.
### Some defaults for the pagination piece:
 - If a `limit` value isn't passed, it's defaulted to 20.
  * This limits the number of items returned from the API call
 - if an `offset` value isn't passed, it's defaulted to 0.
  * This tells the DB how many records to skip before pulling values. You basically want to increase this value by the value of the limit on successive calls to get the data next in the table.
### Some defaults for Sorting/Ordering:
 - If a `sortBy` value isn't passed, then we usually default to `id DESC`. This will correspond to just the latest created clips or videos.
 - If a `sortOrder` value isn't passed, then we default it to `DESC`.

### Available Sorting Fields
 - `createdDate` - the date that the clip or video was created
    * `api/v1/profiles/communities/clips?sortBy=createdDate&sortOrder=[desc|asc]`
 - `streamerName` - the name of the person who was streaming in the clip
    * `api/v1/profiles/communities/clips?sortBy=streamerName&sortOrder=[desc|asc]`
 - `gameMode` - this is the specific game mode being played in fortnite. This value defaults to 'Battle Royale', and get's updated by the metadata ml pipeline.
    * `api/v1/profiles/communities/clips?sortBy=gameMode&sortOrder=[desc|asc]`
 - `streamCaption` - this will sort by all of the wizard sessions basically
    * `api/v1/profiles/communities/clips?sortBy=streamCaption&sortOrder=[desc|asc]`
 - `streamDate` - this will sort it by the date that the stream was broadcasted on
    * `api/v1/profiles/communities/clips?sortBy=streamDate&sortOrder=[desc|asc]`

### Examples
Let's say we want to get all the clips belonging to the communities you belong to, and issue successive pagination requests sorted by streamer name. We also want to paginate it to only return 20 results on each request.
```
GET /api/v1/profiles/communities/clips?limit=20&offset=0&sortBy=streamerName
GET /api/v1/profiles/communities/clips?limit=20&offset=20&sortBy=streamerName
GET /api/v1/profiles/communities/clips?limit=20&offset=40&sortBy=streamerName
GET /api/v1/profiles/communities/clips?limit=20&offset=60&sortBy=streamerName
```
This can be done with any of the above sorting fields.

You will also be getting a `pagination` object back as well as the `data` object.
Here's an example:

```json
"pagination": {
    "limit": 10,
    "offset": 0,
    "sortBy": "streamerName",
    "hasMore": false
}
```
### Endpoints that support this pagination/sorting
 - /api/v1/profiles/channels/clips
 - /api/v1/profiles/communities/:id/videos
 - /api/v1/profiles/communities/videos
 - /api/v1/profiles/channels/clips
 - /api/v1/profiles/channels/clips/manual
 - /api/v1/profiles/channels/clips/auto
 - /api/v1/profiles/videos/
 - /api/v1/profiles/communities?fields=videos


API Brain Dump:

- # /api/v1/auth/login (POST)
  - **backend/source/routes/auth.js**
  - Sample Request Body: `"{\"email\":\"robert+charles@wizardlabs.gg\",\"password\":\"password\"}"` 
  - Sample Response: `"{\"status\":\"ok\",\"payload\":{\"userId\":164,\"token\":\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1ODM5NTg2NjgsImV4cCI6MTU4NDA0NTA2OCwic3ViIjoiMTY0In0.fceyhrRrjHhiJmRSil8XwboMmUHv8vMrY2rjgkOxNPc\"}}"`

- # /api/v1/auth/register (POST)
  - **backend/source/routes/auth.js**
  - Sample Request Body: `"{\"email\":\"robert+charles@wizardlabs.gg\",\"password\":\"password\"}"` 
  - Sample Response: `"{\"status\":\"ok\",\"payload\":{\"userId\":164,\"token\":\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1ODM5NTg2NjgsImV4cCI6MTU4NDA0NTA2OCwic3ViIjoiMTY0In0.fceyhrRrjHhiJmRSil8XwboMmUHv8vMrY2rjgkOxNPc\"}}"`

- # /api/v1/auth/token (PUT)
  - **backend/source/routes/auth.js**
  - There's no request body for this, just a PUT with an empty body. The code looks at the Bearer token and either refreshes it or returns it if it's still valid.
  - Sample Response:`"{\"status\":\"ok\",\"payload\":{\"token\":\"thesameoranewvalidtoken\"}}"` 

- # /api/v1/profiles (PUT)
  - **backend/source/routes/userProfile.js**
  - Updates username and 'name'
  - Sample request: `"{\"userName\":\"bobbb\",\"name\":\"\"}"`
  - Sample response: `"{\"email\":\"robert+charles@wizardlabs.gg\",\"userName\":\"bobbb\",\"name\":null,\"status\":\"COMPLETED\",\"avatar\":\"https://wizardlabs-userdata.s3-us-east-2.amazonaws.com/user/avatar/yyhbtkyfkjadjcoe5ujxr.jpeg\",\"background\":\"https://wizardlabs-userdata.s3-us-east-2.amazonaws.com/user/background/bscc2z3goekfi37z92u5gb.jpeg\"}"`

- # /api/v1/profiles (GET)
  - **backend/source/routes/userProfile.js**
  - Grabs the profile info like name/username
  - Sets avatar/username/background
  - Sample response: `"{\"email\":\"robert+fake2@wizardlabs.gg\",\"userName\":\"bob\",\"name\":null,\"status\":\"COMPLETED\"}"`

- # /api/v1/profiles/communities (GET)
- # /api/v1/profiles/communities?fields=videos
  - **backend/source/routes/community/community.js**
  - Query Params:
    * fields (string) - The only value this honors is "videos".
  - If you pass 'fields=videos', then it will actually return all videos shared to all communities the user belongs to. If you don't pass that field, it just returns information on each community that they belong to.
  - This is overloaded quite weirdly to be honest, the `fields=videos` endpoint I think really should be `/api/v1/profiles/communities/videos`, but it's slightly different. This endpoint returns videos from EVERYONE that belongs to and has shared videos to ANY community the user belongs to as well. The other endpoint will return just the USER'S videos that belong to their communities.
  - Sample response: `"{\"status\":\"ok\",\"payload\":{\"data\":[{\"id\":9,\"name\":\"Icebreakers\",\"description\":null,\"logo\":\"https://wizardlabs-community.s3-us-west-2.amazonaws.com/logo/1.jpg\",\"tags\":null,\"socialChannels\":[],\"membersCount\":0,\"postsCount\":0,\"viewsCount\":0,\"followersCount\":0,\"videos\":[{\"id\":29,\"name\":\"Qwwq Fortnite 03/06/2020 05:53\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg\",\"createdDate\":\"2020-03-06T17:55:44Z\"},{\"id\":28,\"name\":\"Qwwq Fortnite 03/06/2020 05:53\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg\",\"createdDate\":\"2020-03-06T17:55:39Z\"},{\"id\":27,\"name\":\"Qwwq Fortnite 03/06/2020 05:53\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg\",\"createdDate\":\"2020-03-06T17:55:37Z\"},{\"id\":26,\"name\":\"Qwwq Fortnite 03/06/2020 05:53\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg\",\"createdDate\":\"2020-03-06T17:55:36Z\"},{\"id\":25,\"name\":\"Qwwq Fortnite 03/06/2020 05:53\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg\",\"createdDate\":\"2020-03-06T17:55:34Z\"},{\"id\":24,\"name\":\"Qwwq Fortnite 03/06/2020 05:53\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg\",\"createdDate\":\"2020-03-06T17:53:59Z\"},{\"id\":23,\"name\":\"Test Test Fortnite 03/05/2020 06:46\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/ivmur5p93wyugly0daak.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/ebj558qcmkil8advwgaj3q.jpg\",\"createdDate\":\"2020-03-05T18:47:08Z\"},{\"id\":22,\"name\":\"Fortnite l !newvid Fortnite 03/03/2020 03:12\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/sqcr7jua517dh0cu1wm4i.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/upvk4uztskhz5s50v1ia59.jpg\",\"createdDate\":\"2020-03-03T15:14:03Z\"},{\"id\":21,\"name\":\"Duos w/ Zemie Fortnite 02/24/2020 11:07\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/bk9r67ypw3fzgvns0n9cc.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/hbfk0ysp14mpz3poe0fmu.jpg\",\"createdDate\":\"2020-02-24T11:07:49Z\"},{\"id\":20,\"name\":\"videoName Fortnite 02/22/2020 07:35\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/4374fan7iszz44rpy8kn5q.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/v0zm08ub9xbz752zj4xa5.jpg\",\"createdDate\":\"2020-02-24T11:06:12Z\"}]}]}}"`
  - Sample Response (fields=videos): `{ "status": "ok", "payload": { "data": [ { "id": 43, "name": "03/11/2020 10:45", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qu8v7q48t70e68qkfyaoij.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/hu2dm0uu4qvgnj3bkkkh.jpg", "createdDate": "2020-03-11T22:46:07Z", "owner": { "id": 161, "name": "bobert I" } }, { "id": 42, "name": "03/11/2020 08:35", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/jaw9v9r2p8occ2hr8j7m7d.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/8ie5z98vhclyz64t8u3ghe.jpg", "createdDate": "2020-03-11T20:35:47Z", "owner": { "id": 164, "name": "bobbb" } }, { "id": 41, "name": "03/10/2020 03:21", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/il2echm0oga2jh5z0zxlk.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/istdhpji6gdoj4abj3oeoo.jpg", "createdDate": "2020-03-10T15:23:08Z", "owner": { "id": 146, "name": "tco1" } }, { "id": 40, "name": "03/10/2020 01:57", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/4ilyffnll3l4e884lr9qr9.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/xoz651svmwbp8nehnd3m1c.jpg", "createdDate": "2020-03-10T13:57:55Z", "owner": { "id": 146, "name": "tco1" } }, { "id": 39, "name": "Qwwq Fortnite 03/09/2020 07:40", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/42zwbycu8g4n1pnnynd6kk.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/alh87ydvlu4fcxj7256of4.jpg", "createdDate": "2020-03-10T11:20:45Z", "owner": { "id": 146, "name": "tco1" } }, { "id": 38, "name": "Fortnite 03/09/2020 12:57", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/ulidcgwq8hgchn4eh9qbv7.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/794up9pc0ob4e0h4ek45wi.jpg", "createdDate": "2020-03-09T16:50:43Z", "owner": { "id": 146, "name": "tco1" } }, { "id": 37, "name": "yyyyg Fortnite 03/06/2020 10:28", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/9yq99qvgcz63wa9y5zii.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/zf9oqedsfb9zgip4anztw9.jpg", "createdDate": "2020-03-06T22:31:20Z", "owner": { "id": 163, "name": "TekNCode" } }, { "id": 36, "name": "yyyyg Fortnite 03/06/2020 10:28", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/9yq99qvgcz63wa9y5zii.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/zf9oqedsfb9zgip4anztw9.jpg", "createdDate": "2020-03-06T22:31:11Z", "owner": { "id": 163, "name": "TekNCode" } }, { "id": 35, "name": "yyyyg Fortnite 03/06/2020 10:28", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/9yq99qvgcz63wa9y5zii.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/zf9oqedsfb9zgip4anztw9.jpg", "createdDate": "2020-03-06T22:30:31Z", "owner": { "id": 163, "name": "TekNCode" } }, { "id": 34, "name": "yyyyg Fortnite 03/06/2020 10:28", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/9yq99qvgcz63wa9y5zii.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/zf9oqedsfb9zgip4anztw9.jpg", "createdDate": "2020-03-06T22:30:11Z", "owner": { "id": 163, "name": "TekNCode" } }, { "id": 33, "name": "yyyyg Fortnite 03/06/2020 10:28", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/9yq99qvgcz63wa9y5zii.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/zf9oqedsfb9zgip4anztw9.jpg", "createdDate": "2020-03-06T22:30:07Z", "owner": { "id": 163, "name": "TekNCode" } }, { "id": 32, "name": "yyyyg Fortnite 03/06/2020 10:28", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/9yq99qvgcz63wa9y5zii.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/zf9oqedsfb9zgip4anztw9.jpg", "createdDate": "2020-03-06T22:29:40Z", "owner": { "id": 163, "name": "TekNCode" } }, { "id": 31, "name": "yyyyg Fortnite 03/06/2020 10:28", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/9yq99qvgcz63wa9y5zii.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/zf9oqedsfb9zgip4anztw9.jpg", "createdDate": "2020-03-06T22:29:35Z", "owner": { "id": 163, "name": "TekNCode" } }, { "id": 30, "name": "03/06/2020 06:22", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/2py93jk5ceg9vizpfdqnvn.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/291pe4yzokybkyylua8aa.jpg", "createdDate": "2020-03-06T18:22:17Z", "owner": { "id": 161, "name": "bobert I" } }, { "id": 29, "name": "Qwwq Fortnite 03/06/2020 05:53", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg", "createdDate": "2020-03-06T17:55:44Z", "owner": { "id": 152, "name": "roosevelt" } }, { "id": 28, "name": "Qwwq Fortnite 03/06/2020 05:53", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg", "createdDate": "2020-03-06T17:55:39Z", "owner": { "id": 152, "name": "roosevelt" } }, { "id": 27, "name": "Qwwq Fortnite 03/06/2020 05:53", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg", "createdDate": "2020-03-06T17:55:37Z", "owner": { "id": 152, "name": "roosevelt" } }, { "id": 26, "name": "Qwwq Fortnite 03/06/2020 05:53", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg", "createdDate": "2020-03-06T17:55:36Z", "owner": { "id": 152, "name": "roosevelt" } }, { "id": 25, "name": "Qwwq Fortnite 03/06/2020 05:53", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg", "createdDate": "2020-03-06T17:55:34Z", "owner": { "id": 152, "name": "roosevelt" } }, { "id": 24, "name": "Qwwq Fortnite 03/06/2020 05:53", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg", "createdDate": "2020-03-06T17:53:59Z", "owner": { "id": 152, "name": "roosevelt" } }, { "id": 23, "name": "Test Test Fortnite 03/05/2020 06:46", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/ivmur5p93wyugly0daak.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/ebj558qcmkil8advwgaj3q.jpg", "createdDate": "2020-03-05T18:47:08Z", "owner": { "id": 161, "name": "bobert I" } }, { "id": 22, "name": "Fortnite l !newvid Fortnite 03/03/2020 03:12", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/sqcr7jua517dh0cu1wm4i.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/upvk4uztskhz5s50v1ia59.jpg", "createdDate": "2020-03-03T15:14:03Z", "owner": { "id": 162, "name": "evgeny" } }, { "id": 21, "name": "Duos w/ Zemie Fortnite 02/24/2020 11:07", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/bk9r67ypw3fzgvns0n9cc.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/hbfk0ysp14mpz3poe0fmu.jpg", "createdDate": "2020-02-24T11:07:49Z", "owner": { "id": 146, "name": "tco1" } }, { "id": 20, "name": "videoName Fortnite 02/22/2020 07:35", "url": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/4374fan7iszz44rpy8kn5q.mp4", "thumbnailUrl": "https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/v0zm08ub9xbz752zj4xa5.jpg", "createdDate": "2020-02-24T11:06:12Z", "owner": { "id": 146, "name": "tco1" } } ] } }`

- # /api/v1/profiles/communities/clips (GET)
  - **backend/source/routes/community/clip.js**
  - Gets all video clips from users who belong to communities the current user does
  - Query Params:
    * limit (number) - the number of entries to show
    * offset (number) - where to start
  - Sample response: `"{\"status\":\"ok\",\"payload\":{\"data\":[{\"id\":2211,\"name\":\"Fortnite | !newvid\",\"type\":\"MANUAL\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/clip/20x66oz3w5yoolitkjjr5o.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/clip/thumbnail/s8e43sjnoavcd4fwovk6.jpg\",\"createdDate\":\"2020-03-11T06:03:46Z\"},{\"id\":2210,\"name\":\"Fortnite | !newvid\",\"type\":\"MANUAL\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/clip/5ihmvshcsf8o57zt3c9fpd.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/clip/thumbnail/q02voepyblsunjezskfjmc.jpg\",\"createdDate\":\"2020-03-11T05:56:24Z\"},{\"id\":2209,\"name\":\"Fortnite l !newvid\",\"type\":\"MANUAL\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/clip/dretnyitbkbqxsmavuwqe.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/clip/thumbnail/qm5aqf30rkpq9zsrv1skts.jpg\",\"createdDate\":\"2020-03-11T05:55:04Z\"},{\"id\":2208,\"name\":\"Fortnite l !newvid\",\"type\":\"MANUAL\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/clip/wzucgelf949l08ffludcci.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/clip/thumbnail/nbkbgs9et6ioo1dem0i8lb.jpg\",\"createdDate\":\"2020-03-11T05:54:02Z\"},{\"id\":2207,\"name\":\"Fortnite l !newvid\",\"type\":\"MANUAL\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/clip/6cbxvdr8q8e0fi8kfoll5vh.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/clip/thumbnail/oxdtk4kp2egfc45witlqrg.jpg\",\"createdDate\":\"2020-03-11T05:50:54Z\"},{\"id\":2206,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3150.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3150.jpg\",\"createdDate\":\"2020-03-11T03:29:42Z\"},{\"id\":2205,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3151.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3151.jpg\",\"createdDate\":\"2020-03-11T03:29:21Z\"},{\"id\":2204,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3136.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3136.jpg\",\"createdDate\":\"2020-03-11T03:29:02Z\"},{\"id\":2203,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3137.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3137.jpg\",\"createdDate\":\"2020-03-11T03:28:44Z\"},{\"id\":2202,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3090.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3090.jpg\",\"createdDate\":\"2020-03-11T03:28:39Z\"},{\"id\":2201,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3023.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3023.jpg\",\"createdDate\":\"2020-03-11T03:25:50Z\"},{\"id\":2200,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3007.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3007.jpg\",\"createdDate\":\"2020-03-11T03:25:19Z\"},{\"id\":2199,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_2990.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_2990.jpg\",\"createdDate\":\"2020-03-11T03:25:05Z\"},{\"id\":2198,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3008.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_3008.jpg\",\"createdDate\":\"2020-03-11T03:24:34Z\"},{\"id\":2197,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_2985.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_2985.jpg\",\"createdDate\":\"2020-03-11T03:24:10Z\"},{\"id\":2196,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_2991.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_2991.jpg\",\"createdDate\":\"2020-03-11T03:24:02Z\"},{\"id\":2195,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_2436.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_2436.jpg\",\"createdDate\":\"2020-03-11T03:18:23Z\"},{\"id\":2194,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_2728.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_2728.jpg\",\"createdDate\":\"2020-03-11T03:15:52Z\"},{\"id\":2193,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_2355.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_2355.jpg\",\"createdDate\":\"2020-03-11T03:10:45Z\"},{\"id\":2192,\"name\":\"\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_2356.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/0c797572c4c44e65a8bca43f96a3d1c5/0c797572c4c44e65a8bca43f96a3d1c5_2356.jpg\",\"createdDate\":\"2020-03-11T03:09:15Z\"}]}}"`

  - # /api/v1/profiles/communities/videos (GET)
    - **backend/source/routes/community/video.js** 
    - Get's all user videos that belong to any communities they belong to
    - Sample response: `"{\"status\":\"ok\",\"payload\":{\"data\":[{\"id\":29,\"name\":\"Qwwq Fortnite 03/06/2020 05:53\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg\",\"createdDate\":\"2020-03-06T17:55:44Z\"},{\"id\":28,\"name\":\"Qwwq Fortnite 03/06/2020 05:53\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg\",\"createdDate\":\"2020-03-06T17:55:39Z\"},{\"id\":27,\"name\":\"Qwwq Fortnite 03/06/2020 05:53\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg\",\"createdDate\":\"2020-03-06T17:55:37Z\"},{\"id\":26,\"name\":\"Qwwq Fortnite 03/06/2020 05:53\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg\",\"createdDate\":\"2020-03-06T17:55:36Z\"},{\"id\":25,\"name\":\"Qwwq Fortnite 03/06/2020 05:53\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg\",\"createdDate\":\"2020-03-06T17:55:34Z\"},{\"id\":24,\"name\":\"Qwwq Fortnite 03/06/2020 05:53\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/qpsafs7z9fa9f4ene32cb.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/qffc2hp1ykdfwjnut0u07.jpg\",\"createdDate\":\"2020-03-06T17:53:59Z\"},{\"id\":23,\"name\":\"Test Test Fortnite 03/05/2020 06:46\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/ivmur5p93wyugly0daak.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/ebj558qcmkil8advwgaj3q.jpg\",\"createdDate\":\"2020-03-05T18:47:08Z\"},{\"id\":22,\"name\":\"Fortnite l !newvid Fortnite 03/03/2020 03:12\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/sqcr7jua517dh0cu1wm4i.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/upvk4uztskhz5s50v1ia59.jpg\",\"createdDate\":\"2020-03-03T15:14:03Z\"},{\"id\":21,\"name\":\"Duos w/ Zemie Fortnite 02/24/2020 11:07\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/bk9r67ypw3fzgvns0n9cc.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/hbfk0ysp14mpz3poe0fmu.jpg\",\"createdDate\":\"2020-02-24T11:07:49Z\"},{\"id\":20,\"name\":\"videoName Fortnite 02/22/2020 07:35\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/4374fan7iszz44rpy8kn5q.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/video/thumbnail/v0zm08ub9xbz752zj4xa5.jpg\",\"createdDate\":\"2020-02-24T11:06:12Z\"}]}}"`

- # /api/v1/profiles/communities/:communityId/videos (POST)
  - **backend/source/routes/community/video.js**
  - Body params:
    * videoId (number) - unique ID number that points to a specific user's video
  - This adds an existing user's video into a community they belong to
  - Sample request: `"{\"videoId\":\"3028\"}"`
  - Sample response: `"{\"status\":\"ok\",\"payload\":{\"id\":3028}}"`

- # /api/v1/profiles/channels/:channelId/clips/:clipId/frames (GET)
  - **backend/source/routes/channel/clip.js** (line 326)
  - Pulls metadata for our clips that were put there by the metatagger, things like kill distance and such for ML Emojis.
  - This is tied to 'channels' when it shouldn't be at all, has nothing to do with it. Move it.

- # /api/v1/profiles/channels/clips (GET)
  - **backend/source/routes/channel/clip.js**
  - Gets the last 20 clips for the user
  - Query Params:
    * limit (number) - the number of entries to show
    * offset (number) - where to start
    * sortBy (string) - usually 'channel', to sort by channel
  - Supports pagination
  - Sample Response: `"{\"status\":\"ok\",\"payload\":{\"data\":[{\"id\":2053,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/54e882257ad932d8b3841cc3e354865c/54e882257ad932d8b3841cc3e354865c_3106.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/54e882257ad932d8b3841cc3e354865c/54e882257ad932d8b3841cc3e354865c_3106.jpg\",\"timestamp\":1583311872,\"createdDate\":\"2020-03-04T08:51:12Z\"},{\"id\":2047,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_2908.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_2908.jpg\",\"timestamp\":1583310191,\"createdDate\":\"2020-03-04T08:23:11Z\"},{\"id\":2045,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_2832.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_2832.jpg\",\"timestamp\":1583309518,\"createdDate\":\"2020-03-04T08:11:58Z\"},{\"id\":2044,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_2728.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_2728.jpg\",\"timestamp\":1583308429,\"createdDate\":\"2020-03-04T07:53:49Z\"},{\"id\":2040,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/54e882257ad932d8b3841cc3e354865c/54e882257ad932d8b3841cc3e354865c_2570.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/54e882257ad932d8b3841cc3e354865c/54e882257ad932d8b3841cc3e354865c_2570.jpg\",\"timestamp\":1583307019,\"createdDate\":\"2020-03-04T07:30:19Z\"},{\"id\":2003,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_2156.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_2156.jpg\",\"timestamp\":1583303871,\"createdDate\":\"2020-03-04T06:37:51Z\"},{\"id\":1998,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_2088.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_2088.jpg\",\"timestamp\":1583303323,\"createdDate\":\"2020-03-04T06:28:43Z\"},{\"id\":1994,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_1900.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_1900.jpg\",\"timestamp\":1583301971,\"createdDate\":\"2020-03-04T06:06:11Z\"},{\"id\":1991,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_1883.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_1883.jpg\",\"timestamp\":1583301855,\"createdDate\":\"2020-03-04T06:04:15Z\"},{\"id\":1988,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_1734.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_1734.jpg\",\"timestamp\":1583300877,\"createdDate\":\"2020-03-04T05:47:57Z\"},{\"id\":1987,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_1705.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_1705.jpg\",\"timestamp\":1583300714,\"createdDate\":\"2020-03-04T05:45:14Z\"},{\"id\":1986,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_1701.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_1701.jpg\",\"timestamp\":1583300691,\"createdDate\":\"2020-03-04T05:44:51Z\"},{\"id\":1985,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_1627.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_1627.jpg\",\"timestamp\":1583300292,\"createdDate\":\"2020-03-04T05:38:12Z\"},{\"id\":1977,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_1118.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_1118.jpg\",\"timestamp\":1583297911,\"createdDate\":\"2020-03-04T04:58:31Z\"},{\"id\":1975,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_967.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_967.jpg\",\"timestamp\":1583297194,\"createdDate\":\"2020-03-04T04:46:34Z\"},{\"id\":1974,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_935.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_935.jpg\",\"timestamp\":1583297053,\"createdDate\":\"2020-03-04T04:44:13Z\"},{\"id\":1973,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/54e882257ad932d8b3841cc3e354865c/54e882257ad932d8b3841cc3e354865c_866.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/54e882257ad932d8b3841cc3e354865c/54e882257ad932d8b3841cc3e354865c_866.jpg\",\"timestamp\":1583296555,\"createdDate\":\"2020-03-04T04:35:55Z\"},{\"id\":1971,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_800.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_800.jpg\",\"timestamp\":1583296509,\"createdDate\":\"2020-03-04T04:35:09Z\"},{\"id\":1970,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_797.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_797.jpg\",\"timestamp\":1583296491,\"createdDate\":\"2020-03-04T04:34:51Z\"},{\"id\":1967,\"name\":\"Test Test\",\"type\":\"AUTO\",\"gameName\":\"Fortnite\",\"tags\":[],\"url\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_643.mp4\",\"thumbnailUrl\":\"https://cloudmedia.wizardlabs.gg/clips/b4c1e69ef5d12f21e410f8a64b269792/b4c1e69ef5d12f21e410f8a64b269792_643.jpg\",\"timestamp\":1583295801,\"createdDate\":\"2020-03-04T04:23:21Z\"}],\"paging\":{\"cursors\":{\"next\":20}}}}"`

- # /api/v1/profiles/videos/overlays (GET)
  - **backend/source/routes/userVideo/overlay.js**
  - This grabs a user's 'overlay' files; supports pagination
  - This pulls from two views that support 'common' overlays. This was white-gloved for Icebreakers, but was designed well by Maxim and can be used further down the road to share common overlays every user might like (and to seed the initial version of it so it's not blank when the user clicks to add an image overlay)
  - Example response: `"{\"status\":\"ok\",\"payload\":{\"data\":[{\"id\":4,\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/overlay/common/ng7nlsb128oh6nq1rek1k8.png\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/overlay/common/thumbnail/dfnxsom9zrd3dl4wevgdw.png\",\"access\":\"common\"},{\"id\":3,\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/overlay/common/e838b9rp0ediee3e6z8yv.png\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/overlay/common/thumbnail/kdy5xeasq8qs8ixgspt1y.png\",\"access\":\"common\"},{\"id\":2,\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/overlay/common/3iwrge9ls9lik8k6ns9wx8.png\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/overlay/common/thumbnail/vcafej7g59d32u4qyxxiq.png\",\"access\":\"common\"},{\"id\":1,\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/overlay/common/0j8vsagsbay5fyzd3y6dw7.png\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/overlay/common/thumbnail/0hg7igw2f16tst8qw8f109r.png\",\"access\":\"common\"}]}}"`

- # /api/v1/profiles/videos (GET)
  - **backend/source/routes/userVideo/video.js**
  - Used to get all of the user's videos
  - Query Params:
    * limit (number) - the number of entries to show
    * offset (number) - where to start

- # /api/v1/profiles/videos (POST)
  - **backend/source/routes/userVideo/video.js**
  - Used to get a signed URL to post an edited clip, which turns into a video at this point. The video is formatted directly on the phone, then uses this to get a place to upload it.
  - Body Params:
    * createdDate (date) - created date
    * tags (Array<string>) - A set of descriptive words about the clip
    * clipId (number) - unique ID of the original clip the user is editing
    * fileName (string) - Name of the file to upload
    * name (string) - The name of the clip
    * metadata (Object) - Object that _must_ pass 'duration', so {metadata: {duration: 2343}}

- # /api/v1/profiles/videos/:videoId/thumbnails (PUT)

- # /api/v1/music
  - **backend/source/routes/topSongs.js**
  - Powers our music service as an MVP. Cached hourly by redis.
  - Returns description, thumbnail, and file download link to a 30 second clip.
    * - `downloadLink` represents the URL that will be forwarded to the _actual_ download file after it generates a signed URL for download that expires after a bit. This link is safer even though there is a redirect (there shouldn't be any streaming implications because a decent lib should just follow redirects.)
  - Sample response: `"{\"status\":\"ok\",\"payload\":{\"data\":[{\"songTitle\":\"Higher Love\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/71+2fHIHZPL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B07THC2C28&DownloadLocation=WEBSITE\",\"asin\":\"B07THC2C28\",\"songArtist\":\"Kygo & Whitney Houston\"},{\"songTitle\":\"Happier\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/61fp-h8KDdL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B07GBLSQLK&DownloadLocation=WEBSITE\",\"asin\":\"B07GBLSQLK\",\"songArtist\":\"Marshmello & Bastille\"},{\"songTitle\":\"Something Just Like This\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/71Wf4CZuWhL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B06VWVWDDH&DownloadLocation=WEBSITE\",\"asin\":\"B06VWVWDDH\",\"songArtist\":\"The Chainsmokers & Coldplay\"},{\"songTitle\":\"Wake Me Up\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/613D3PpIiML._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B00F0AIBJC&DownloadLocation=WEBSITE\",\"asin\":\"B00F0AIBJC\",\"songArtist\":\"Avicii\"},{\"songTitle\":\"Here With Me\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/612VzxD83mL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B07PJXR4J5&DownloadLocation=WEBSITE\",\"asin\":\"B07PJXR4J5\",\"songArtist\":\"Marshmello & CHVRCHES\"},{\"songTitle\":\"Daze (Missing & Messed up Mix)\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/91ezkdK-umL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B08281V2RR&DownloadLocation=WEBSITE\",\"asin\":\"B08281V2RR\",\"songArtist\":\"The Orb\"},{\"songTitle\":\"One Kiss\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/81MTW1c-v2L._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B07BSPLS3R&DownloadLocation=WEBSITE\",\"asin\":\"B07BSPLS3R\",\"songArtist\":\"Dua Lipa Calvin Harris\"},{\"songTitle\":\"Good Things Fall Apart\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/71d8zIo6QyL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B07RDKVKBQ&DownloadLocation=WEBSITE\",\"asin\":\"B07RDKVKBQ\",\"songArtist\":\"ILLENIUM & Jon Bellion\"},{\"songTitle\":\"Greenlights\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/910hRDsY1oL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B081W2J7D5&DownloadLocation=WEBSITE\",\"asin\":\"B081W2J7D5\",\"songArtist\":\"Krewella\"},{\"songTitle\":\"Devil\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/91FAevYSc8L._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B07B4YVQK6&DownloadLocation=WEBSITE\",\"asin\":\"B07B4YVQK6\",\"songArtist\":\"Vive la Void\"},{\"songTitle\":\"Intentions [feat. Quavo]\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/81lleqz5QXL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B0848CGR8Y&DownloadLocation=WEBSITE\",\"asin\":\"B0848CGR8Y\",\"songArtist\":\"Justin Bieber\"},{\"songTitle\":\"Yummy\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/81lleqz5QXL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B0847V5M2D&DownloadLocation=WEBSITE\",\"asin\":\"B0847V5M2D\",\"songArtist\":\"Justin Bieber\"},{\"songTitle\":\"Yummy (Summer Walker Remix)\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/81lleqz5QXL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B0848CDGSN&DownloadLocation=WEBSITE\",\"asin\":\"B0848CDGSN\",\"songArtist\":\"Justin Bieber & Summer Walker\"},{\"songTitle\":\"Get Me [feat. Kehlani]\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/81lleqz5QXL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B0848D8CZV&DownloadLocation=WEBSITE\",\"asin\":\"B0848D8CZV\",\"songArtist\":\"Justin Bieber\"},{\"songTitle\":\"Memories\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/71nIIQmyG5L._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B07XVGPNM4&DownloadLocation=WEBSITE\",\"asin\":\"B07XVGPNM4\",\"songArtist\":\"Maroon 5\"},{\"songTitle\":\"Perfect\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/B1TlPSY5bKS._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B01MS6IM0X&DownloadLocation=WEBSITE\",\"asin\":\"B01MS6IM0X\",\"songArtist\":\"Ed Sheeran\"},{\"songTitle\":\"Good as Hell [Explicit]\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/81vEhrIzARL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B01LR0H3WO&DownloadLocation=WEBSITE\",\"asin\":\"B01LR0H3WO\",\"songArtist\":\"Lizzo\"},{\"songTitle\":\"Time Stands\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/81WQP5O3QoL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B082P96HG7&DownloadLocation=WEBSITE\",\"asin\":\"B082P96HG7\",\"songArtist\":\"Nathaniel Rateliff\"},{\"songTitle\":\"What A Man Gotta Do\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/81tIui3HmTL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B083WP23JH&DownloadLocation=WEBSITE\",\"asin\":\"B083WP23JH\",\"songArtist\":\"Jonas Brothers\"},{\"songTitle\":\"Only Human\",\"thumbnailSrc\":\"https://images-na.ssl-images-amazon.com/images/I/81s-SBSe+vL._AC_SX184_.jpg\",\"downloadLink\":\"https://www.amazon.com/gp/dmusic/get_sample_url.html/ref=dm_trk_smpl_gsu?ie=UTF8&ASIN=B07R67MKLJ&DownloadLocation=WEBSITE\",\"asin\":\"B07R67MKLJ\",\"songArtist\":\"Jonas Brothers\"}]}}"`

- # /api/v1/profiles/videos/bumpers (GET)
  - **backend/source/routes/userVideo/bumper.js**
  - This route grabs pre/post roll bumpers that are common or belonging to the user
  - Query Params:
    * type (string) - either 'pre' or 'post', which define "pre roll bumpers" and "post roll bumpers"
  - Sample response: `"{\"status\":\"ok\",\"payload\":{\"data\":[{\"id\":5,\"type\":\"pre\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/bumper/common/x8zi81jygaihdj5kreq187.mov\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/bumper/common/thumbnail/ksuncindctdpfmx78w4zec.jpg\",\"access\":\"common\"},{\"id\":3,\"type\":\"pre\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/bumper/common/v92qhienbop98yqeum73sr.m4v\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/bumper/common/thumbnail/5k19lm4wyv2btpinunheb.jpg\",\"access\":\"common\"},{\"id\":1,\"type\":\"pre\",\"url\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/bumper/common/esgs41nao3zto7go3ipum.mp4\",\"thumbnailUrl\":\"https://wizardlabs-uservideo.s3-us-west-2.amazonaws.com/bumper/common/thumbnail/otbdfogccxwk0djb55pce.jpg\",\"access\":\"common\"}]}}"`
  
- # /api/v1/profiles/avatar (POST)
  - **backend/source/routes/userProfile.js**
  - This uses a `multer` middleware again to upload a file, expecting the file contents to be placed on `request.file` 
  - Sample request: `"{\"encoding\": \"base64\", \"encoded\": \"verylongbase64decodedstring\"}}\"`
  - Sample response: `"{\"status\":\"ok\",\"payload\":{\"url\":\"https://wizardlabs-userdata.s3-us-east-2.amazonaws.com/user/avatar/tsnt8dee2nen8lk5pnlekh.jpeg\"}}"`

- # /api/v1/profiles/background (POST)
  - **backend/source/routes/userProfile.js**
  - This uses a `multer` middleware again to upload a file, expecting the file contents to be placed on `request.file` 
  - Sample request: `"{\"encoding\": \"base64\", \"encoded\": \"verylongbase64decodedstring\"}}\"`
  - Sample response: `"{\"status\":\"ok\",\"payload\":{\"url\":\"https://wizardlabs-userdata.s3-us-east-2.amazonaws.com/user/background/bscc2z3goekfi37z92u5gb.jpeg\"}}"`

- # /api/v1/providers/channels/videos
  - **backend/source/routes/videoDownloadInfo.js**
  - Get information about a video or live stream, most importantly a link to download the VOD or stream files as they are made
  - Query Params:
    * source (string) - the URL of a video or stream to get download information from (i.e., https://twitch.tv/ninja)
  - Sample request: `GET /api/v1/providers/channels/videos?source=https://twitch.tv/sypherpk
  - Sample response `"This stream has ended"`
  - Sample response `"This stream has ended"`
  - Sample Response `This video might be for paid subscribers of this channel`
  - Sample Response `This stream has ended`
  - Sample Response `This video is DRM protected`
  - Sample Response `This video no longer exists`
  - Sample Response `Invalid URL passed`
  - Sample Response `Invalid YouTube ID (seems truncated)`
  - Sample Response `This clip is no longer available`
  - Sample response: `"{\"status\":\"ok\",\"payload\":{\"data\":[{\"id\":\"37116463808\",\"title\":\"Good vibes only - !MVMT !Respawn\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/previews-ttv/live_user_sypherpk-320x180.jpg\",\"publishedDate\":\"2020-03-10T15:28:38Z\",\"viewerCount\":5352,\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/SypherPK\",\"type\":\"live\"},{\"id\":\"551873596\",\"title\":\"IRL & LIVE at Daytona 500! - @SypherPK on all Social - !MVMT !Respawn \",\"description\":\"\",\"duration\":\"1:18:29\",\"thumbnailUrl\":\"\",\"publishedDate\":\"2020-02-14T16:59:12Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/551873596\",\"type\":\"archive\"},{\"id\":\"551326877\",\"title\":\"Last Stream Before Daytona 500 Trip! - @SypherPK on all Social - !MVMT !Respawn \",\"description\":\"\",\"duration\":\"4:41:23\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/3a1716442bbbf77d7f6e_sypherpk_36915629376_1375988199/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-13T15:03:35Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/551326877\",\"type\":\"archive\"},{\"id\":\"550855379\",\"title\":\"Fortnite Content Factory  - Code: SypherPK - !MVMT !Respawn \",\"description\":\"\",\"duration\":\"3:49:25\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/bf6391bbfa70529e81c6_sypherpk_36908004000_1375511143/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-12T16:17:53Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/550855379\",\"type\":\"archive\"},{\"id\":\"550466813\",\"title\":\"GOOD MORNING  - Code: SypherPK - !MVMT !Respawn \",\"description\":\"\",\"duration\":\"5:56:4\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/56dd34e41d881786640e_sypherpk_36901105136_1375079566/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-11T20:08:03Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/550466813\",\"type\":\"archive\"},{\"id\":\"550347385\",\"title\":\"GOOD MORNING  - Code: SypherPK - !MVMT !Respawn \",\"description\":\"\",\"duration\":\"3:12:16\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/d4aa533f86b49dbb8f76_sypherpk_36899961936_1375008013/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-11T15:40:15Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/550347385\",\"type\":\"archive\"},{\"id\":\"550103375\",\"title\":\"Fortnite Content Factory - Code: SypherPK - !MVMT !Respawn \",\"description\":\"\",\"duration\":\"4:13:29\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/7777b7b380bd40f60b27_sypherpk_36895581712_1374733912/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-11T00:56:56Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/550103375\",\"type\":\"archive\"},{\"id\":\"549847854\",\"title\":\"Fortnite Content Factory - Code: SypherPK - !MVMT !Respawn \",\"description\":\"\",\"duration\":\"3:0:58\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/6d3dc7062571a7024863_sypherpk_36892062192_1374513684/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-10T15:17:44Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/549847854\",\"type\":\"archive\"},{\"id\":\"548817307\",\"title\":\"Yes I crank 90's - Code: SypherPK - !MVMT !Respawn \",\"description\":\"\",\"duration\":\"4:55:6\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/6c3bfdf21f87b1c4378d_sypherpk_36874562128_1373419059/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-08T16:38:10Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/548817307\",\"type\":\"archive\"},{\"id\":\"548509735\",\"title\":\"good vibes - Code: SypherPK - !MVMT !Respawn \",\"description\":\"\",\"duration\":\"4:22:4\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/0762c382d112d36e9882_sypherpk_36869234784_1373085794/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-08T01:32:50Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/548509735\",\"type\":\"archive\"},{\"id\":\"548195999\",\"title\":\"Morning Fortnite - Code: SypherPK - !MVMT !Respawn \",\"description\":\"\",\"duration\":\"3:46:16\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/98f1c81e8e662589e80d_sypherpk_36864836192_1372810645/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-07T14:23:01Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/548195999\",\"type\":\"archive\"},{\"id\":\"547959973\",\"title\":\"we like fortnite and we don't care who knows - !MVMT !Respawn \",\"description\":\"\",\"duration\":\"4:0:26\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/1c7cb8bbd913ce409ccf_sypherpk_36860369136_1372531167/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-07T00:36:51Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/547959973\",\"type\":\"archive\"},{\"id\":\"547760928\",\"title\":\"Returning to Runescape! - @SypherPK on all Socials - !MVMT !Respawn\",\"description\":\"\",\"duration\":\"3:53:24\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/5d6eb20b627ccdf772c4_sypherpk_36857544048_1372354446/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-06T17:22:40Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/547760928\",\"type\":\"archive\"},{\"id\":\"547206142\",\"title\":\"LAUNCH PADS ARE BACK and more! - @SypherPK on all Socials  - !MVMT !Respawn\",\"description\":\"\",\"duration\":\"10:2:50\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/a7fccc99af45b467d3b0_sypherpk_36849161296_1371829901/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-05T14:40:33Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/547206142\",\"type\":\"archive\"},{\"id\":\"546762974\",\"title\":\"Keanu Reeves is visiting  \\\"Code: SypherPK\\\" - !MVMT !RESPAWN\",\"description\":\"\",\"duration\":\"3:53:54\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/baa9a20f3bbcf4b62db2_sypherpk_36841770528_1371367597/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-04T17:29:44Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/546762974\",\"type\":\"archive\"},{\"id\":\"546234520\",\"title\":\"Morning Fortnite \\\"Code: SypherPK\\\" - !MVMT !RESPAWN\",\"description\":\"\",\"duration\":\"8:49:4\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/6f20c0e0f666b0eb7cf4_sypherpk_36833747856_1370865697/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-03T15:37:58Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/546234520\",\"type\":\"archive\"},{\"id\":\"546088052\",\"title\":\"Squads w/ NickEh30 and NASCARS' Austin Dillon & Chase Elliot! #Daytona500 #ad \",\"description\":\"\",\"duration\":\"1:4:20\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/2046e821a70cffebb255_sypherpk_36831585936_1370730381/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-03T04:32:52Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/546088052\",\"type\":\"archive\"},{\"id\":\"545970233\",\"title\":\"HOUSE WARMING STREAM! I'M BACK! - !MVMT !Respawn\",\"description\":\"\",\"duration\":\"1:45:48\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/8063764b34e4a0b16dbf_sypherpk_36828877424_1370560984/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-02T22:24:25Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/545970233\",\"type\":\"archive\"},{\"id\":\"545875660\",\"title\":\"HOUSE WARMING STREAM! I'M BACK! - !MVMT !Respawn\",\"description\":\"\",\"duration\":\"3:0:33\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/ab7fa5952dec63a716b8_sypherpk_36827384768_1370467638/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-02-02T19:10:27Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/545875660\",\"type\":\"archive\"},{\"id\":\"543705347\",\"title\":\"Short Fun Fortnite Stream - !MVMT !Respawn\",\"description\":\"\",\"duration\":\"2:11:23\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/93b84a732a0bc16a7bcd_sypherpk_36792486912_1368284646/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-01-29T18:07:35Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/543705347\",\"type\":\"archive\"},{\"id\":\"543209459\",\"title\":\"Making you Smile :) - SypherPK on TIKTOK - !MVMT !Respawn\",\"description\":\"\",\"duration\":\"10:45:22\",\"thumbnailUrl\":\"https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/8ca34da57052bc7d92d7_sypherpk_36784659728_1367794968/thumb/thumb0-320x180.jpg\",\"publishedDate\":\"2020-01-28T18:15:01Z\",\"providerType\":\"twitch\",\"videoUrl\":\"https://twitch.tv/videos/543209459\",\"type\":\"archive\"}]}}"`

===
 # Routes that need to be renamed/moved or are used less, or just more info

- # /api/v1/profiles/channels/:channelId/clips (POST)
  - **backend/source/routes/channel/clip.js**
  - This is used to either copy an existing clip or create a new MANUAL clip
  - This should be moved to remove the `:channelId` dep which is no longer used
  - Query Params:
    * Action (string) - 'copy' to copy an existing clip
  - Body params:
    * createdDate
    * gameName
    * streamerName
    * sourceId (for 'copy' action)
    * fileName

- # /api/v1/profiles/channels/:channelId/clips/:clipId/thumbnails (PUT)
  - **backend/source/routes/channel/clip.js**
  - This exists as a callback function for the clipper service. The job is created, and once the thumbnail is completed it is placed in S3 by the clipper service. The service then uses a 'callback' parameter passed to it which represents this endpoint. This endpoint will then just update the entry in the database to point to this location.

- # /api/v1/profiles/channels/:channelId/clips/:clipId/upload (PUT)
- # /api/v1/profiles/channels/:channelId/clips/:clipId (DELETE)
- # /api/v1/profiles/channels/clip/:id (DELETE)
- # /api/v1/profiles/channels/clip/:id/name (PUT)
- # /api/v1/profiles/accounts
  - This handles OAuth stuff. I think we can remove this and count on GIT history to bring any code back if we need it
