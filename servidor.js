const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Guardar datos endpoint
    if (req.method === 'POST' && req.url === '/guardar-datos') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                JSON.parse(body);
                fs.writeFileSync(
                    path.join(__dirname, 'datos-financieros.json'), 
                    body,
                    'utf8'
                );
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({success: true, message: 'Datos guardados'}));
                console.log('💾 Datos guardados correctamente');
            } catch (err) {
                console.error('❌ Error guardando datos:', err.message);
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({success: false, error: err.message}));
            }
        });
        return;
    }

    // Obtener datos endpoint
    if (req.method === 'GET' && req.url === '/datos-financieros.json') {
        const filePath = path.join(__dirname, 'datos-financieros.json');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // Archivo no existe, retornar objeto vacío
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({users: {}}));
                } else {
                    console.error('❌ Error leyendo archivo:', err.message);
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({success: false, error: err.message}));
                }
                return;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(data);
            console.log('✅ Datos servidos');
        });
        return;
    }

    // Health check endpoint
    if (req.url === '/ping') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('OK');
        return;
    }

    // Servir archivos estáticos
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    // Seguridad: prevenir directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, {'Content-Type': 'text/plain'});
        res.end('Acceso denegado');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('404 - Archivo no encontrado');
            } else {
                console.error('❌ Error leyendo archivo:', err.message);
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end('500 - Error del servidor');
            }
            return;
        }
        
        // Detectar tipo MIME automáticamente
        const contentType = mime.lookup(filePath) || 'application/octet-stream';
        res.writeHead(200, {'Content-Type': contentType});
        res.end(data);
        console.log(`✅ Servido: ${req.url}`);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📂 Sirviendo desde: ${__dirname}`);
    console.log(`✅ Presiona Ctrl+C para detener\n`);
});

// Manejo de errores
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Puerto ${PORT} ya está en uso`);
        console.error('Solución: Cierra la otra aplicación o cambia el puerto');
    } else {
        console.error('❌ Error del servidor:', err.message);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Servidor detenido');
    process.exit(0);
});
