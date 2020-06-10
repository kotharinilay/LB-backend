try {
    const tracer = require('dd-trace').init();
} catch(e) {
    console.error("dd-trace is not found");
}
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser')();
require('dotenv').config();

const {validatePagingSorting} = require('./common/middlewares/PaginationSortingValidator');
const auth = require('./routes/auth');
const userProfile = require('./routes/userProfile');
const topStream = require('./routes/topStream');
const account = require('./routes/account');
const userAccount = require('./routes/userAccount/main');
const userVideo = require('./routes/userVideo/main');
const userSettings = require('./routes/userSettings');
const userGame = require('./routes/userGame');
const userChannel = require('./routes/channel/main');
const userCommunity = require('./routes/community/main');
const common = require('./routes/common');
const beta = require('./routes/beta');
const socialProvidersChannel = require('./routes/socialProvidersChannel');
const game = require('./routes/game');
const ingestRoute = require('./routes/ingest');
const videoDownloadInfo = require('./routes/videoDownloadInfo');
const topMusic = require('./routes/topSongs');
const community = require('./routes/community');
const userClips = require('./routes/userClips');
const social = require('./routes/social');
const cinematics = require('./routes/cinematics');
const assets = require('./routes/assets');

const API_VERSION = process.env.API_VERSION;

console.info(
  `Application starting on environment: '${process.env.ENVIRONMENT_NAME}', ` +
  `version: '${API_VERSION}'`
);

const app = express();
const wizardApp = express();

app.use(express.json());
app.use(cors({origin: true}));
app.use(cookieParser);
app.use(`/api/${API_VERSION}`, wizardApp);

wizardApp.use(validatePagingSorting);
wizardApp.use('/auth', auth);
wizardApp.use('/profiles/accounts', userAccount);
wizardApp.use('/profiles/videos', userVideo);
wizardApp.use('/profiles/communities', userCommunity);
wizardApp.use('/profiles/channels', userChannel);
wizardApp.use('/profiles/clips', userClips);
wizardApp.use('/profiles/settings', userSettings);
wizardApp.use('/profiles/games', userGame);
wizardApp.use('/profiles', userProfile);
wizardApp.use('/accounts', account);
wizardApp.use('/topstream', topStream);
wizardApp.use('/beta', beta);
wizardApp.use('/providers', socialProvidersChannel);
wizardApp.use('/games', game);
wizardApp.use('/ingest', ingestRoute);
wizardApp.use('/videosource', videoDownloadInfo);
wizardApp.use('/music', topMusic);
wizardApp.use('/communities', community);
wizardApp.use('/social', social);
wizardApp.use('/cinematics', cinematics);
wizardApp.use('/assets', assets);
wizardApp.use('', common);

app.use((req, res, next) => {
  console.warn('Route not found:', req.path);
  res.sendStatus(404);
});

app.use((err, req, res, next) => {
  console.error('Error occurred:', err);

  const body = {
    status: 'error',
    payload: {
      message: '',
      description: ''
    }
  };

  if (err.hasOwnProperty('statusCode')) {
    body.payload.message = err.message;
    body.payload.description = err.description;
    res.status(err.statusCode);
  } else if (err.name === 'MulterError') {
    body.payload.message = 'Cannot upload file';
    body.payload.description = err.message;
    res.status(400);
  } else {
    body.payload.message = 'Something went wrong';
    body.payload.description = err.message;
    res.status(500);
  }

  res.json(body);
});

app.listen(8080, () => console.log(`Application listening on port ${8080}!`));
