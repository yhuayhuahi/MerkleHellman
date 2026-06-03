// public/app.js

// Función para cambiar de pestaña de forma dinámica
function switchTab(panelId) {
  // Desactivar todas las pestañas y paneles
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));

  // Activar la pestaña clickeada
  const btnActivo = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.getAttribute('onclick').includes(panelId));
  if (btnActivo) btnActivo.classList.add('active');

  // Mostrar el panel correspondiente
  document.getElementById(panelId).classList.add('active');
}

// 1. Obtener y mostrar la clave pública desde la API
async function obtenerClavePublica() {
  const keyOutput = document.getElementById('key-output');
  try {
    const response = await fetch('/api/public-key');
    const data = await response.json();
    
    keyOutput.style.display = 'block';
    keyOutput.innerText = `B = [ ${data.public_key.join(', ')} ]`;
  } catch (error) {
    keyOutput.style.display = 'block';
    keyOutput.innerText = 'Error al conectar con el servidor.';
  }
}

// 2. Enviar texto a la API para encriptar
async function ejecutarCifrado() {
    const texto = document.getElementById('texto-plano').value;
    const resultBox = document.getElementById('cifrar-resultado');

    if (!texto) {
      alert('Por favor, escribe un texto para encriptar.');
      return;
    }

    try {
      const response = await fetch('/api/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: texto })
      });
      const data = await response.json();

      if (data.status === 'success') {
        resultBox.style.display = 'block';
        resultBox.innerHTML = `
          <strong>¡Texto Cifrado con Éxito!</strong><br><br>
          Payload a enviar (copia esto entero):<br>
          <code style="background:#fff; padding:2px 5px; border:1px solid #ccc; display:inline-block; margin-top:5px;">
            ${JSON.stringify(data.payload_cifrado)}
          </code>
        `;
      } else {
        resultBox.style.display = 'block';
        resultBox.innerText = 'Error: ' + data.error;
      }
    } catch (error) {
      resultBox.style.display = 'block';
      resultBox.innerText = 'Error de conexión con la API.';
    }
}

// 3. Enviar el payload de números a la API para desencriptar
async function ejecutarDescifrado() {
  const payloadRaw = document.getElementById('payload-input').value;
  const resultBox = document.getElementById('descifrar-resultado');

  if (!payloadRaw) {
    alert('Por favor, introduce el payload en formato de arreglo.');
    return;
  }

  try {
    // Intentamos parsear el string "[12, 34, 56]" a un arreglo real de JS
    const payloadArray = JSON.parse(payloadRaw);

    if (!Array.isArray(payloadArray)) {
      alert('El formato debe ser un arreglo válido. Ejemplo: [12, 43, 52]');
      return;
    }

    const response = await fetch('/api/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: payloadArray })
    });
    const data = await response.json();

    if (data.status === 'success') {
      resultBox.style.display = 'block';
      resultBox.innerHTML = `
          <strong>Mensaje recuperado por el servidor:</strong><br>
          <span style="font-size: 1.4rem; color: #198754; font-weight: bold;">
            "${data.mensaje_original}"
          </span>
      `;
    } else {
      resultBox.style.display = 'block';
      resultBox.innerText = 'Error al descifrar: ' + data.error;
    }
  } catch (error) {
    resultBox.style.display = 'block';
    resultBox.innerText = 'Error: Asegúrate de que el formato sea un arreglo válido de números.';
  }
}
