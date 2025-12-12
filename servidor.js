const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/guardar-datos') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                JSON.parse(body);
                fs.writeFileSync(path.join(__dirname, 'datos-financieros-2026.json'), body);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({success: true}));
                console.log('💾 Datos guardados');
            } catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({success: false}));
            }
        });
        return;
    }
    
    if (req.url === '/ping') {
        res.writeHead(200);
        res.end('OK');
        return;
    }
    
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('No encontrado');
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
});
