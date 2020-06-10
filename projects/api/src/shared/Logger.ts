/**
 * Setup the winston logger.
 *
 * Documentation: https://github.com/winstonjs/winston
 */

import { createLogger, format, transports } from 'winston';

// Import Functions
const { File, Console } = transports;

// Init Logger
const logger = createLogger({
    // TODO: Add ability to enable DEBUG via env var
    level: 'info',
});

/**
 * For production write to all logs to the console in json format
 * For development, print human-readable colorized logs to the console.
 */
if (process.env.NODE_ENV === 'production') {
    const consoleTransport = new Console({
        format: format.combine(
            format.timestamp(),
            format.json(),
        ),
    });
    logger.add(consoleTransport);
} else {

    const errorStackFormat = format((info) => {
        if (info.stack) {
            // tslint:disable-next-line:no-console
            console.log(info.stack);
            return false;
        }
        return info;
    });
    const consoleTransport = new Console({
        format: format.combine(
            format.colorize(),
            format.simple(),
            errorStackFormat(),
        ),
    });
    logger.add(consoleTransport);
}

export default logger;
