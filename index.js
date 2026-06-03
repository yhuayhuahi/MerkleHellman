import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors());

// ==========================================
// CONFIGURACIÓN CRYPTO (8 bits = 1 carácter por bloque)
// ==========================================
const TAMANO_MOCHILA = 8; 

function generarClaves(n) {
    let W = [];
    let sumaActual = 0;
    
    // Paso 1: Secuencia supercreciente (no importa qué tanto mayor, usamos aleatorios)
    for (let i = 0; i < n; i++) {
        let siguiente = sumaActual + Math.floor(Math.random() * 30) + 10;
        W.push(siguiente);
        sumaActual += siguiente;
    }
    
    // Paso 2: q mayor que la suma total (convenientemente un número primo cercano)
    let q = sumaActual + Math.floor(Math.random() * 100) + 50;
    // Función simple para verificar si es primo (así aseguramos el paso 3)
    const esPrimo = num => {
        for(let i = 2, s = Math.sqrt(num); i <= s; i++) if(num % i === 0) return false; 
        return num > 1;
    }
    while(!esPrimo(q)) { q++; }
    
    // Paso 3: r coprimo con q (al ser q primo, casi cualquiera menor sirve)
    let r = Math.floor(Math.random() * (q - 2)) + 2;
    
    // Paso 4: Calcular clave pública B aplicando el residuo si supera a q
    let publica = W.map(w => (w * r) % q);
    
    return { W, q, r, publica };
}

// Algoritmo de Euclides extendido para el inverso de r mod q
function inversoModular(a, m) {
    let m0 = m, x0 = 0, x1 = 1;
    if (m === 1) return 0;
    while (a > 1) {
        let q_div = Math.floor(a / m);
        let t = m;
        m = a % m;
        a = t;
        t = x0;
        x0 = x1 - q_div * x0;
        x1 = t;
    }
    if (x1 < 0) x1 += m0;
    return x1;
}

// Inicializar los símbolos en la memoria global del servidor
const { W, q, r, publica } = generarClaves(TAMANO_MOCHILA);

console.log("=== Llaves del Servidor Inicializadas ===");
console.log("Clave Pública (B):", publica);

// ==========================================
// ENDPOINTS DE LA API
// ==========================================

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
        let resultadoArrayCifrado = [];

        // Troceamos el texto: procesamos carácter por carácter
        for (let i = 0; i < texto.length; i++) {
            const ascii = texto.charCodeAt(i);
            const bits = ascii.toString(2).padStart(8, '0').split('').map(Number);

            // Aplicar la fórmula matemática de la mochila con la clave pública
            let numeroCifrado = 0;
            for (let j = 0; j < bits.length; j++) {
                numeroCifrado += bits[j] * publica[j];
            }
            resultadoArrayCifrado.push(numeroCifrado);
        }

        res.json({
            status: "success",
            payload_cifrado: resultadoArrayCifrado // Devuelve un array de números (uno por letra)
        });

    } catch (error) {
        res.status(500).json({ error: "Error al encriptar el texto largo." });
    }
});

// 3. Descifrar un array de números y reconstruir el texto original
app.post("/api/decrypt", (req, res) => {
    const { payload } = req.body; // Ej: { "payload": [72, 118, 93, 52] }

    if (!payload || !Array.isArray(payload)) {
        return res.status(400).json({ error: "Debes enviar un array de números (payload)." });
    }

    try {
        let textoReconstruido = "";
        let rInverso = inversoModular(r, q);

        // Iteramos por cada número cifrado en el array
        for (let numeroCifrado of payload) {
            let cPrima = (numeroCifrado * rInverso) % q;
            
            let bits = [];
            // Resolver la mochila fácil (de atrás hacia adelante)
            for (let i = W.length - 1; i >= 0; i--) {
                if (cPrima >= W[i]) {
                    bits.push(1);
                    cPrima -= W[i];
                } else {
                    bits.push(0);
                }
            }
            bits.reverse();
            
            // Convertir bits a carácter y acumularlo
            let codigoAscii = parseInt(bits.join(""), 2);
            textoReconstruido += String.fromCharCode(codigoAscii);
        }

        res.json({
            status: "success",
            mensaje_original: textoReconstruido
        });

    } catch (error) {
        res.status(500).json({ error: "Error al descifrar el payload." });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en: http://localhost:${PORT}/`);
});
