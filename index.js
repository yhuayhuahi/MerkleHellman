import express from 'express';
import cors from 'cors';

import { generarClaves, inversoModular, encriptar, desencriptar } from './algorithm.js'

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors());

app.use(express.static('public'))

// CONFIGURACIÓN CRYPTO (8 bits = 1 carácter por bloque)
const TAMANO_MOCHILA = 8; 

// Inicializar los símbolos en la memoria global del servidor
const { W, q, r, publica } = generarClaves(TAMANO_MOCHILA);

console.log("=== Llaves del Servidor Inicializadas ===");
console.log("Clave Pública (B):", publica);

// 1. Entregar la clave pública
app.get("/api/public-key", (req, res) => {
    res.json({ public_key: publica });
});

// 2. Encriptar cualquier longitud de texto (Trocea el texto letra por letra)
app.post("/api/encrypt", (req, res) => {
    const { texto } = req.body; // Ej: { "texto": "HOLA" }

    if (!texto) {
        return res.status(400).json({ error: "Debes enviar un texto para encriptar." });
    }

    try {       
        res.json({
            status: "success",
            payload_cifrado: encriptar(texto, publica) // Devuelve un array de números (uno por letra)
        });

    } catch (error) {
        res.status(500).json({ error: "Error al encriptar el texto largo." });
    }
});

// 3. Descifrar un array de números y reconstruir el texto original
app.post("/api/decrypt", (req, res) => {
    const { payload } = req.body; // ejemplo { "payload": [72, 118, 93, 52] }

    if (!payload || !Array.isArray(payload)) {
        return res.status(400).json({ error: "Debes enviar un array de números (payload)." });
    }

    try {
        res.json({
            status: "success",
            mensaje_original: desencriptar(payload, r, q, W)
        });

    } catch (error) {
        res.status(500).json({ error: "Error al descifrar el payload." });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en: http://localhost:${PORT}/`);
});
