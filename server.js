var http = require('http'),
    formidable = require('formidable'),
    urllib = require('url'),
    fs = require('fs'),
    compiler = require('./compiler');

var settings = {
    PORT: process.env.PORT || 3000
};

function respondWithError(res, status, message) {
    res.writeHead(status, {'content-type': 'text/plain'});
    res.end(message + '\n');
}

function respondWithResult(res, result) {
    res.writeHead(200, {'content-type': 'text/css'});
    res.end(result);
}

http.createServer(function(req, res) {

    if (req.url === '/' && req.method.toLowerCase() === 'post') {
        // Main entry point (POST request to /)
        var form = new formidable.IncomingForm();

        form.parse(req, function(err, fields, files) {
            var url = fields.url || '',
                input = fields.less;

            if (typeof input == 'undefined' && files.less) {
                // Source file has been received as an attachment
                input = fs.readFileSync(files.less.path, { encoding: 'utf-8' });
            }

            if (!input) {
                // We won't raise error on empty input
                // Empty input -> empty output
                return respondWithResult(res, '/* Source file is empty */');
            }

            if (url && url[url.length - 1] !== '/') {
                // Add trailing slash to the URL
                url += '/';
            }

            var parsedURL = urllib.parse(url);
            if (!parsedURL.host) {
                // Assume that URL is incorrect
                parsedURL = null;
            }

            compiler.run(input, parsedURL, function(err, output) {
                if (err) {
                    console.log('Compilation failed for request with URL set to:', url);
                    console.log(err.message + '\n');
                    return respondWithError(res, 400, err.message);
                }

                respondWithResult(res, output);
            });
        });
    } else {
        return respondWithError(res, 404, 'Nothing to do here');
    }

}).listen(settings.PORT, function() {
    console.log('LESS server is running on port', settings.PORT);
});
