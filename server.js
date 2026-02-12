const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const formidable = require('formidable');

const uploadFolder = path.join(__dirname, 'uploads');

// Ensure upload folder exists
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

const server = http.createServer((req, res) => {
    if (req.method.toLowerCase() === 'get') {
        // Serve HTML and uploaded images
        let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);

        // If requesting uploads folder
        if (req.url.startsWith('/uploads/')) {
            filePath = path.join(__dirname, req.url);
        }

        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 - File Not Found</h1>', 'utf8');
                } else {
                    res.writeHead(500);
                    res.end(`Server Error: ${err.code}`);
                }
            } else {
                res.writeHead(200, { 'Content-Type': mime.lookup(filePath) || 'text/html' });
                res.end(content, 'utf8');
            }
        });
    } else if (req.method.toLowerCase() === 'post' && req.url === '/upload') {
        // Handle file upload
        const form = formidable({ multiples: false, uploadDir: uploadFolder, keepExtensions: true });

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Error parsing the file.');
                return;
            }

            const file = files.file;

            if (!file) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('No file uploaded.');
                return;
            }

            // Validate image type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
                // Delete invalid file
                fs.unlinkSync(file.filepath);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Invalid file type. Only images are allowed.');
                return;
            }

            // Rename file to include timestamp
            const newFilename = `${Date.now()}-${file.originalFilename}`;
            const newPath = path.join(uploadFolder, newFilename);
            fs.renameSync(file.filepath, newPath);

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`File uploaded successfully: ${newFilename}`);
        });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
