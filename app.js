const fs = require('fs');
const path = require('path');
const http = require('http');

const DIRNAME = path.join(__dirname, 'www');
const DEFAULT_ENCODING = 'UTF-8';
const PORT = 1233;//1024 + (Math.random() * 10000 | 0);
const INDEXFILE = 'index.html';

Error.prototype.toJSON = function () {
    return {
        name: this.name,
        message: this.message,
        stack: this.stack.split('\n').map(function (line) {
            return line.trim();
        }),
    };
};

const logToDev = function () {
    const date = new Date;
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    const args = Array.from(arguments);
    const dateJson = date.toJSON();
    args.unshift('[' + dateJson + ']', process.pid);
    console.log.apply(console, args);
};

const logToFile = function () {
    
};

const log = function () {
    logToDev.apply(null, arguments);
    logToFile.apply(null, arguments);
};

const request = {
    convertRequestToFilePath: function (req) {
        let filePath = path.resolve(path.join(DIRNAME, req.url))
        if (0 !== filePath.indexOf(DIRNAME)) {
            throw new Error('INVALID PATH')
        }
        return filePath
    },
    getHeaders: function (filePath, buffer) {
        const parsedPath = path.parse(filePath)

        const headers = {}

        if (parsedPath.ext === '.html') {
            headers['content-type'] = 'text/html; charset=' + DEFAULT_ENCODING
        }

        if (parsedPath.ext === '.js') {
            headers['content-type'] = 'application/javascript; charset=' + DEFAULT_ENCODING
        }

        if (buffer instanceof Buffer) {
            headers['content-length'] = buffer.length
        }

        return headers
    },
    getFilePath: function (filePath) {
        try {
            return fs.readFileSync(filePath)
        } catch (error) {
            throw new Error('ERROR GETTING FILE: ' + filePath)
        }
    },
    parse: function (req) {
        let resolve = null;
        let reject = null;
        const promise = new Promise(function (res, rej) {
            resolve = res;
            reject = rej;
        })

        try {
            const filePath = request.convertRequestToFilePath(req);
            const buffer = request.getFilePath(filePath);
            const headers = request.getHeaders(filePath, buffer);
            const result = {
                filePath,
                buffer,
                headers,
            };
            resolve(result);
        } catch (error) {
            reject(error);
        }

        return promise;
    },
};

const server = http.createServer(function (req, res) {
    log('REQUEST', req.method, req.url);
    request.parse(req).then(function (result) {
        for (const headerName in result.headers) {
            res.setHeader(headerName, result.headers[headerName]);
        }
        res.end(result.buffer);
    }).catch(function (error) {
        logToFile('ERROR', error);
        res.end();
    });
});

server.on('error', function (error) {
    log('ERROR', error);
});

server.on('clientError', function (error) {
    log('CLIENT ERROR', error);
});

server.listen(PORT, function () {
    log('LISTENING ON PORT', PORT);
    log('GO TO', 'http://127.0.0.1:' + PORT + '/' + INDEXFILE);
});
