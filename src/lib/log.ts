import config from '../config';

function log(str: string): void {
    if (config.appStdOut) {
        console.log(str);
    }
}

export default {
    write: log,
};
