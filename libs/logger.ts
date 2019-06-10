import * as log from 'loglevel';
import * as prefix from 'loglevel-plugin-prefix';
const logger  = log.getLogger('webhub');

prefix.reg(log);
prefix.apply(logger);

logger.setLevel(log.levels.DEBUG);

export default logger;
