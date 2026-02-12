const http = require('http');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');

const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

const publicFolder = path.join(__dirname, 'public');

const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        let filePath = path.join(publicFolder, req.url === '/' ? 'index.html' : req.url);

        if (req.url.startsWith('/uploads/')) {
            filePath = path.join(__dirname, req.url);
        }

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
                res.end(content);
            }
        });
    } else if (req.method === 'POST' && req.url === '/upload') {
        const form = formidable({ multiples: false, uploadDir: uploadFolder, keepExtensions: true });

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Error parsing file.');
                return;
            }

            const file = files.file;
            if (!file) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('No file uploaded.');
                return;
            }

            const newFilename = `${Date.now()}-${file.originalFilename}`;
            const newPath = path.join(uploadFolder, newFilename);
            fs.renameSync(file.filepath, newPath);

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`File uploaded successfully: ${newFilename}`);
        });
    } else if (req.method === 'GET' && req.url === '/files') {
        fs.readdir(uploadFolder, (err, files) => {
            if (err) return res.end(JSON.stringify([]));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(files));
        });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
