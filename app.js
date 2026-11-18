// =====================================================
// app.js · LÓGICA COMPLETA
// Funciona con: index.html, login.html, sala.html, chat.html, videollamada.html
// =====================================================

// ---------- DATOS COMPARTIDOS ----------
let nombreUsuario = 'Tú';
let amigaActual = null;
let streamCamara = null;
let segundosLlamada = 0;
let timerLlamada = null;
let micSilenciado = false;
let camaraApagada = false;

const baseAmigas = [
  { nombre: 'María González',   avatar: '👩‍🦱', estado: 'en-linea' },
  { nombre: 'Ana Pérez',        avatar: '👩‍🦰', estado: 'en-linea' },
  { nombre: 'Luisa Fernández',  avatar: '👩',    estado: 'ocupada' },
  { nombre: 'Carmen Ruiz',      avatar: '👩‍🦳', estado: 'ausente' },
  { nombre: 'Sofía Martínez',   avatar: '👱‍♀️', estado: 'en-linea' },
  { nombre: 'Laura Gómez',      avatar: '👩‍🎤', estado: 'desconectada' },
  { nombre: 'Daniela Torres',   avatar: '👩‍🔬', estado: 'en-linea' },
  { nombre: 'Valeria Jiménez',  avatar: '👩‍🎨', estado: 'ocupada' },
  { nombre: 'Andrea López',     avatar: '🧑‍🦰', estado: 'ausente' },
  { nombre: 'Patricia Sánchez', avatar: '👩‍🏫', estado: 'en-linea' },
];
let usuarias = baseAmigas.map(u => ({ ...u }));
let filtroBuscar = '';

const respuestasChat = [
  '¡Hola! ¿Cómo estás? 😊', '¡Qué bueno saber de ti!',
  'Jajaja, qué gracioso 😂', 'Cuéntame más...',
  '¡Sí, total! 💕', 'Estoy de acuerdo contigo',
  '¿Viste lo que pasó ayer? 😮', '¡Te extrañaba! 🥰',
  '¿Quedamos mañana? ✨', '¡Aww, qué lindo! 🥺',
];

// ---------- DETECTAR EN QUÉ PÁGINA ESTAMOS ----------
const pagina = window.location.pathname.split('/').pop() || 'index.html';

// ---------- FUNCIÓN: VALIDAR CORREO ----------
function correoValido(texto) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
}

// ---------- PÁGINA: login.html ----------
if (pagina === 'login.html') {
  const btnEntrar = document.getElementById('btnEntrar');
  const btnRegistrarse = document.getElementById('btnRegistrarse');
  const formEntrar = document.getElementById('formEntrar');
  const formRegistro = document.getElementById('formRegistro');
  const mensajeExito = document.getElementById('mensajeExito');
  const textoExito = document.getElementById('textoExito');
  const btnOjo = document.getElementById('btnOjo');
  const btnOjo2 = document.getElementById('btnOjo2');

  // Cambiar pestaña: Entrar / Registrarse
  if (btnEntrar && btnRegistrarse) {
    btnEntrar.addEventListener('click', () => {
      btnEntrar.classList.add('activa');
      btnRegistrarse.classList.remove('activa');
      formEntrar.classList.add('visible');
      formRegistro.classList.remove('visible');
      mensajeExito.classList.remove('visible');
    });

    btnRegistrarse.addEventListener('click', () => {
      btnRegistrarse.classList.add('activa');
      btnEntrar.classList.remove('activa');
      formRegistro.classList.add('visible');
      formEntrar.classList.remove('visible');
      mensajeExito.classList.remove('visible');
    });
  }

  // Mostrar/ocultar contraseña
  function configurarOjo(botonId, inputId) {
    const boton = document.getElementById(botonId);
    const input = document.getElementById(inputId);
    if (boton && input) {
      boton.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
        boton.textContent = input.type === 'password' ? '👁️' : '🙈';
      });
    }
  }
  configurarOjo('btnOjo', 'clave');
  configurarOjo('btnOjo2', 'claveReg');

  // Mostrar/ocultar errores
  function mostrarError(elementoId, errorId, hayError) {
    const el = document.getElementById(elementoId);
    const err = document.getElementById(errorId);
    if (el && err) {
      if (hayError) {
        el.classList.add('error');
        err.classList.add('visible');
        return false;
      }
      el.classList.remove('error');
      err.classList.remove('visible');
    }
    return true;
  }

  // Inicio de sesión
  if (formEntrar) {
    formEntrar.addEventListener('submit', e => {
      e.preventDefault();
      const correo = document.getElementById('correo').value.trim();
      const clave = document.getElementById('clave').value;
      const ok1 = mostrarError('correo', 'errorCorreo', !correoValido(correo));
      const ok2 = mostrarError('clave', 'errorClave', clave.length < 6);
      
      if (ok1 && ok2) {
        nombreUsuario = correo.split('@')[0];
        textoExito.textContent = `¡Hola ${nombreUsuario}! Ya puedes entrar a la sala.`;
        mensajeExito.classList.add('visible');
        // Guardar nombre en el navegador para usarlo en la sala
        localStorage.setItem('nombreUsuario', nombreUsuario);
      }
    });
  }

  // Registro
  if (formRegistro) {
    formRegistro.addEventListener('submit', e => {
      e.preventDefault();
      const nombre = document.getElementById('nombre').value.trim();
      const correo = document.getElementById('correoReg').value.trim();
      const clave = document.getElementById('claveReg').value;
      const ok1 = mostrarError('nombre', 'errorNombre', nombre.length < 2);
      const ok2 = mostrarError('correoReg', 'errorCorreoReg', !correoValido(correo));
      const ok3 = mostrarError('claveReg', 'errorClaveReg', clave.length < 6);
      
      if (ok1 && ok2 && ok3) {
        nombreUsuario = nombre;
        textoExito.textContent = `¡Cuenta creada, ${nombre}! Bienvenida.`;
        mensajeExito.classList.add('visible');
        localStorage.setItem('nombreUsuario', nombreUsuario);
      }
    });
  }
}

// ---------- PÁGINA: sala.html ----------
if (pagina === 'sala.html') {
  // Recuperar nombre del usuario
  const guardado = localStorage.getItem('nombreUsuario');
  if (guardado) nombreUsuario = guardado;
  
  const nombreUsuarioEl = document.getElementById('nombreUsuario');
  const saludoNombre = document.getElementById('saludoNombre');
  const listaPersonas = document.getElementById('listaPersonas');
  const buscador = document.getElementById('buscar');

  if (nombreUsuarioEl) nombreUsuarioEl.textContent = nombreUsuario;
  if (saludoNombre) saludoNombre.textContent = nombreUsuario;

  // Dibujar la lista de personas conectadas
  function dibujarSala() {
    if (!listaPersonas) return;
    listaPersonas.innerHTML = '';

    const conectadas = [
      { nombre: nombreUsuario + ' (tú)', avatar: '👩‍🦰', soyYo: true },
      ...usuarias.filter(u => u.estado === 'en-linea')
    ].filter(u => u.nombre.toLowerCase().includes(filtroBuscar.toLowerCase()));

    if (conectadas.length === 0) {
      listaPersonas.innerHTML = `
        <div style="text-align:center; padding:40px; color:#888;">
          😴 Nadie está conectada ahora mismo
        </div>`;
      return;
    }

    conectadas.forEach(u => {
      const div = document.createElement('div');
      div.className = `persona${u.soyYo ? ' eres-tu' : ''}`;
      div.innerHTML = `
        <div class="avatar">
          ${u.avatar}
          <span class="punto-estado en-linea"></span>
        </div>
        <div class="info-persona">
          <div class="nombre-persona">${u.nombre}</div>
          <div class="estado-persona">🟢 Conectada</div>
        </div>
        <span style="color:#ccc; font-weight:bold;">›</span>
      `;
      if (!u.soyYo) {
        div.addEventListener('click', () => {
          amigaActual = u;
          localStorage.setItem('amigaActual', JSON.stringify(u));
          window.location.href = 'chat.html';
        });
      }
      listaPersonas.appendChild(div);
    });
  }

  // Buscador
  if (buscador) {
    buscador.addEventListener('input', e => {
      filtroBuscar = e.target.value;
      dibujarSala();
    });
  }

  // Cambio de estado automático
  setInterval(() => {
    if (usuarias.length === 0) return;
    const cual = Math.floor(Math.random() * usuarias.length);
    const estados = ['en-linea', 'ocupada', 'ausente', 'desconectada'];
    let nuevo;
    do {
      nuevo = estados[Math.floor(Math.random() * estados.length)];
    } while (nuevo === usuarias[cual].estado);
    usuarias[cual].estado = nuevo;
    dibujarSala();
  }, 5000);

  dibujarSala();
}

// ---------- PÁGINA: chat.html ----------
if (pagina === 'chat.html') {
  // Recuperar datos de la amiga
  const guardada = localStorage.getItem('amigaActual');
  if (guardada) amigaActual = JSON.parse(guardada);

  const avatarAmiga = document.getElementById('avatarAmiga');
  const nombreAmiga = document.getElementById('nombreAmiga');
  const cajaMensajes = document.getElementById('cajaMensajes');
  const indicadorEscribiendo = document.getElementById('indicadorEscribiendo');
  const formMensaje = document.getElementById('formMensaje');
  const entradaMensaje = document.getElementById('entradaMensaje');

  if (amigaActual && nombreAmiga) {
    if (avatarAmiga) avatarAmiga.textContent = amigaActual.avatar;
    if (nombreAmiga) nombreAmiga.textContent = amigaActual.nombre;
  }

  // Agregar mensaje al chat
  function agregarMensaje(texto, tipo) {
    if (!cajaMensajes) return;
    const div = document.createElement('div');
    div.className = `mensaje ${tipo}`;
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `
      <div class="texto-mensaje">${texto}</div>
      <div class="hora-mensaje">${hora}</div>
    `;
    cajaMensajes.appendChild(div);
    cajaMensajes.scrollTop = cajaMensajes.scrollHeight;
  }

  // Mensaje de bienvenida
  agregarMensaje('¡Hola! Qué gusto verte 👋', 'recibido');

  // Enviar mensaje
  if (formMensaje && entradaMensaje) {
    formMensaje.addEventListener('submit', e => {
      e.preventDefault();
      const texto = entradaMensaje.value.trim();
      if (!texto) return;
      
      agregarMensaje(texto, 'enviado');
      entradaMensaje.value = '';
      
      // Simular que está escribiendo
      if (indicadorEscribiendo) indicadorEscribiendo.style.display = 'block';
      
      setTimeout(() => {
        if (indicadorEscribiendo) indicadorEscribiendo.style.display = 'none';
        const respuesta = respuestasChat[Math.floor(Math.random() * respuestasChat.length)];
        agregarMensaje(respuesta, 'recibido');
      }, 1500);
    });
  }
}

// ---------- PÁGINA: videollamada.html ----------
if (pagina === 'videollamada.html') {
  const miCamara = document.getElementById('miCamara');
  const mensajeSinCamara = document.getElementById('mensajeSinCamara');
  const tiempo = document.getElementById('tiempo');
  const btnMicrofono = document.getElementById('btnMicrofono');
  const btnCamara = document.getElementById('btnCamara');
  const avatarRemoto = document.getElementById('avatarRemoto');
  const nombreRemoto = document.getElementById('nombreRemoto');

  // Mostrar datos de la amiga
  const guardada = localStorage.getItem('amigaActual');
  if (guardada) amigaActual = JSON.parse(guardada);
  if (amigaActual) {
    if (avatarRemoto) avatarRemoto.textContent = amigaActual.avatar;
    if (nombreRemoto) nombreRemoto.textContent = amigaActual.nombre;
  }

  // Iniciar cámara
  async function iniciarCamara() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (mensajeSinCamara) mensajeSinCamara.innerHTML = '📷 Tu navegador no soporta cámara<br><small>Usa Chrome, Edge o Firefox</small>';
      return;
    }

    try {
      streamCamara = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: true 
      });
      if (miCamara) miCamara.srcObject = streamCamara;
      if (mensajeSinCamara) mensajeSinCamara.style.display = 'none';
      if (miCamara) miCamara.style.display = 'block';
      
      // Iniciar contador de tiempo
      segundosLlamada = 0;
      actualizarTiempo();
      timerLlamada = setInterval(() => {
        segundosLlamada++;
        actualizarTiempo();
      }, 1000);
    } catch (err) {
      console.log('Sin permiso de cámara:', err);
      if (mensajeSinCamara) mensajeSinCamara.style.display = 'flex';
    }
  }

  function actualizarTiempo() {
    if (!tiempo) return;
    const m = String(Math.floor(segundosLlamada / 60)).padStart(2, '0');
    const s = String(segundosLlamada % 60).padStart(2, '0');
    tiempo.textContent = `${m}:${s}`;
  }

  // Silenciar micrófono
  if (btnMicrofono) {
    btnMicrofono.addEventListener('click', () => {
      micSilenciado = !micSilenciado;
      btnMicrofono.classList.toggle('activo', micSilenciado);
      btnMicrofono.textContent = micSilenciado ? '🔇' : '🎤';
      if (streamCamara) {
        streamCamara.getAudioTracks().forEach(t => t.enabled = !micSilenciado);
      }
    });
  }

  // Apagar/encender cámara
  if (btnCamara) {
    btnCamara.addEventListener('click', () => {
      camaraApagada = !camaraApagada;
      btnCamara.classList.toggle('activo', camaraApagada);
      btnCamara.textContent = camaraApagada ? '📷' : '📹';
      if (streamCamara) {
        streamCamara.getVideoTracks().forEach(t => t.enabled = !camaraApagada);
      }
      if (mensajeSinCamara && miCamara) {
        mensajeSinCamara.style.display = camaraApagada ? 'flex' : 'none';
        miCamara.style.display = camaraApagada ? 'none' : 'block';
      }
    });
  }

  // Iniciar automáticamente
  iniciarCamara();
}

// ---------- PWA: Service Worker ----------
if ('serviceWorker' in navigator && pagina === 'index.html') {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

console.log('✅ Sala de Amigas cargada correctamente');
