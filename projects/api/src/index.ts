require('module-alias/register')
import CONFIG from './config'

import app from './Server';
import logger from './shared/Logger';

// Start the server
const port = Number(CONFIG.PORT || 8080);
app.listen(port, () => {
    logger.info('Express server started on port: ' + port);
});
