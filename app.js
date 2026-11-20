// =====================================================
// SALA DE AMIGAS — app.js (el cerebro)
// Se ejecuta en TODAS las páginas.
// =====================================================

// ---------- CONFIGURACIÓN ----------
const SUPABASE_URL = 'https://dkgnxbsvvbceaaoigexj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jRyyfbNuESxhU_TGhqKBgg_8VbxcjCZ';

// ---------- VARIABLES GLOBALES ----------
let nombreUsuario = localStorage.getItem('nombreUsuario') || 'Anónima';
let userId = localStorage.getItem('userId');
if (!userId) {
  userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  localStorage.setItem('userId', userId);
}
let amigaActual = null;
let chatIdActual = localStorage.getItem('chatIdActual');
const pagina = window.location.pathname.split('/').pop() || 'index.html';

function generarChatId(id1, id2) {
  return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
}
function correoValido(texto) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
}

// Inicializar Supabase (solo si la librería cargó)
let supabaseClient;
if (typeof supabase !== 'undefined') {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// =====================================================
// PWA — se ejecuta en TODAS las páginas
// (1) Registrar el service-worker para funcionar offline
// (2) Mostrar botón "📲 Instalar App" cuando el navegador lo permita
// =====================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      // Si no se puede registrar (abrir el archivo con doble clic), no pasa nada.
    });
  });
}

let eventoInstalar = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  eventoInstalar = e;
  mostrarBotonInstalar();
});

function mostrarBotonInstalar() {
  if (document.querySelector('.boton-instalar')) return; // ya existe
  const boton = document.createElement('button');
  boton.className = 'boton-instalar';
  boton.textContent = '📲 Instalar App';
  boton.addEventListener('click', () => {
    if (!eventoInstalar) return;
    eventoInstalar.prompt();
    eventoInstalar.userChoice.then(respuesta => {
      if (respuesta.outcome === 'accepted') {
        boton.style.display = 'none';
      }
      eventoInstalar = null;
    });
  });
  document.body.appendChild(boton);
}
// Si el evento ya pasó antes de que cargara el script, igual mostramos el botón
window.addEventListener('appinstalled', () => {
  const b = document.querySelector('.boton-instalar');
  if (b) b.style.display = 'none';
});

// =====================================================
// PÁGINA: login.html
// =====================================================
if (pagina === 'login.html') {
  const btnEntrar = document.getElementById('btnEntrar');
  const btnRegistrarse = document.getElementById('btnRegistrarse');
  const formEntrar = document.getElementById('formEntrar');
  const formRegistro = document.getElementById('formRegistro');
  const mensajeExito = document.getElementById('mensajeExito');
  const textoExito = document.getElementById('textoExito');

  if (btnEntrar && btnRegistrarse) {
    btnEntrar.addEventListener('click', () => {
      btnEntrar.classList.add('activa');
      btnRegistrarse.classList.remove('activa');
      if (formEntrar) formEntrar.classList.add('visible');
      if (formRegistro) formRegistro.classList.remove('visible');
      if (mensajeExito) mensajeExito.classList.remove('visible');
    });
    btnRegistrarse.addEventListener('click', () => {
      btnRegistrarse.classList.add('activa');
      btnEntrar.classList.remove('activa');
      if (formRegistro) formRegistro.classList.add('visible');
      if (formEntrar) formEntrar.classList.remove('visible');
      if (mensajeExito) mensajeExito.classList.remove('visible');
    });
  }

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

  function mostrarError(elementoId, errorId, hayError) {
    const el = document.getElementById(elementoId);
    const err = document.getElementById(errorId);
    if (el) el.classList.toggle('error', hayError);
    if (err) err.classList.toggle('visible', hayError);
    return !hayError;
  }

  if (formEntrar) {
    formEntrar.addEventListener('submit', e => {
      e.preventDefault();
      const correo = document.getElementById('correo').value.trim();
      const clave = document.getElementById('clave').value;
      const ok1 = mostrarError('correo', 'errorCorreo', !correoValido(correo));
      const ok2 = mostrarError('clave', 'errorClave', clave.length < 6);
      if (ok1 && ok2) {
        nombreUsuario = correo.split('@')[0];
        localStorage.setItem('nombreUsuario', nombreUsuario);
        if (textoExito) textoExito.textContent = `¡Hola ${nombreUsuario}! Conectando…`;
        if (mensajeExito) mensajeExito.classList.add('visible');
        setTimeout(() => window.location.href = 'sala.html', 800);
      }
    });
  }

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
        localStorage.setItem('nombreUsuario', nombreUsuario);
        if (textoExito) textoExito.textContent = `¡Bienvenida, ${nombre}! 🎉`;
        if (mensajeExito) mensajeExito.classList.add('visible');
        setTimeout(() => window.location.href = 'sala.html', 800);
      }
    });
  }
}

// =====================================================
// PÁGINA: sala.html
// =====================================================
if (pagina === 'sala.html' && supabaseClient) {
  const nombreUsuarioEl = document.getElementById('nombreUsuario');
  const saludoNombre = document.getElementById('saludoNombre');
  const listaPersonas = document.getElementById('listaPersonas');
  const buscador = document.getElementById('buscar');
  let filtroBuscar = '';

  if (nombreUsuarioEl) nombreUsuarioEl.textContent = nombreUsuario;
  if (saludoNombre) saludoNombre.textContent = nombreUsuario;

  async function actualizarMiEstado(enLinea) {
    try {
      await supabaseClient.from('conectados').upsert({
        id: userId, nombre: nombreUsuario, en_linea: enLinea,
        ultima_vez: new Date().toISOString()
      });
    } catch (e) { /* sin conexión: no pasa nada */ }
  }
  actualizarMiEstado(true);
  setInterval(() => actualizarMiEstado(true), 15000);
  window.addEventListener('beforeunload', () => {
    supabaseClient.from('conectados').update({ en_linea: false }).eq('id', userId);
  });

  async function cargarConectados() {
    const hace5Minutos = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data, error } = await supabaseClient
      .from('conectados').select('*')
      .eq('en_linea', true).gte('ultima_vez', hace5Minutos);
    if (error) return;
    dibujarSala(data || []);
  }

  function dibujarSala(personas) {
    if (!listaPersonas) return;
    listaPersonas.innerHTML = '';
    const filtradas = personas
      .filter(p => p.id !== userId)
      .filter(p => p.nombre.toLowerCase().includes(filtroBuscar.toLowerCase()));
    if (filtradas.length === 0) {
      listaPersonas.innerHTML = `
        <div style="text-align:center; padding:60px 20px; color:#888;">
          😴 Nadie más está conectado ahora mismo<br>
          <small>¡Comparte tu enlace con tus amigas para chatear!</small>
        </div>`;
      return;
    }
    filtradas.forEach(p => {
      const div = document.createElement('div');
      div.className = 'persona';
      div.innerHTML = `
        <div class="avatar">👩</div>
        <div class="info-persona">
          <div class="nombre-persona">${p.nombre}</div>
          <div class="estado-persona">🟢 Conectada</div>
        </div>
        <span style="color:#ccc; font-weight:bold;">›</span>`;
      div.addEventListener('click', () => {
        amigaActual = p;
        chatIdActual = generarChatId(userId, p.id);
        localStorage.setItem('amigaActual', JSON.stringify(p));
        localStorage.setItem('chatIdActual', chatIdActual);
        window.location.href = 'chat.html';
      });
      listaPersonas.appendChild(div);
    });
  }

  if (buscador) {
    buscador.addEventListener('input', e => {
      filtroBuscar = e.target.value;
      cargarConectados();
    });
  }

  supabaseClient.channel('public:conectados')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conectados' }, cargarConectados)
    .subscribe();
  cargarConectados();
}

// =====================================================
// FUNCIONES COMPARTIDAS DE CHAT (las usan chat.html y videollamada.html)
// =====================================================
async function enviarMensaje(texto) {
  if (!texto || !chatIdActual || !supabaseClient) return;
  await supabaseClient.from('mensajes').insert({
    chat_id: chatIdActual, de: userId, de_nombre: nombreUsuario,
    texto: texto, hora: new Date().toISOString()
  });
}

function crearBurbujaMensaje(datos, claseMensaje, claseHora) {
  const div = document.createElement('div');
  const esMio = datos.de === userId;
  div.className = `${claseMensaje} ${esMio ? 'enviado' : 'recibido'}`;
  const hora = new Date(datos.hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  div.innerHTML = `<div>${datos.texto}</div><div class="${claseHora}">${hora}</div>`;
  return div;
}

async function cargarMensajesEn(container, claseMensaje, claseHora) {
  if (!chatIdActual || !supabaseClient || !container) return;
  const { data, error } = await supabaseClient
    .from('mensajes').select('*')
    .eq('chat_id', chatIdActual).order('hora', { ascending: true });
  if (error) return;
  container.innerHTML = '';
  (data || []).forEach(d => container.appendChild(crearBurbujaMensaje(d, claseMensaje, claseHora)));
  container.scrollTop = container.scrollHeight;
}

function escucharMensajes(container, claseMensaje, claseHora) {
  if (!chatIdActual || !supabaseClient) return;
  supabaseClient.channel('chat_' + chatIdActual + '_' + pagina)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'mensajes',
      filter: `chat_id=eq.${chatIdActual}`
    }, payload => {
      container.appendChild(crearBurbujaMensaje(payload.new, claseMensaje, claseHora));
      container.scrollTop = container.scrollHeight;
    })
    .subscribe();
}

// =====================================================
// PÁGINA: chat.html — mensajes + VIDEO INTEGRADO
// =====================================================
if (pagina === 'chat.html') {
  const guardada = localStorage.getItem('amigaActual');
  if (guardada) amigaActual = JSON.parse(guardada);

  const nombreAmiga = document.getElementById('nombreAmiga');
  const cajaMensajes = document.getElementById('cajaMensajes');
  const formMensaje = document.getElementById('formMensaje');
  const entradaMensaje = document.getElementById('entradaMensaje');

  if (amigaActual && nombreAmiga) {
    nombreAmiga.textContent = amigaActual.nombre;
    const nrc = document.getElementById('nombreRemotoChico');
    if (nrc) nrc.textContent = amigaActual.nombre;
  }

  // --- Mensajes ---
  if (cajaMensajes) {
    cargarMensajesEn(cajaMensajes, 'mensaje', 'hora-mensaje');
    escucharMensajes(cajaMensajes, 'mensaje', 'hora-mensaje');
  }
  if (formMensaje && entradaMensaje) {
    formMensaje.addEventListener('submit', async e => {
      e.preventDefault();
      const texto = entradaMensaje.value.trim();
      entradaMensaje.value = '';
      await enviarMensaje(texto);
    });
  }

  // --- VIDEO INTEGRADO (la novedad): abrir/cerrar panel sin salir del chat ---
  const btnVideo = document.getElementById('btnVideo');
  const panelVideo = document.getElementById('panelVideo');
  const miCamaraChica = document.getElementById('miCamaraChica');
  const sinCamaraChica = document.getElementById('sinCamaraChica');
  const btnMicChico = document.getElementById('btnMicChico');
  const btnCamChico = document.getElementById('btnCamChico');
  const btnMinimizar = document.getElementById('btnMinimizar');
  const btnCerrarVideo = document.getElementById('btnCerrarVideo');

  let streamChico = null;
  let micChicoOn = true, camChicoOn = true;

  async function abrirVideo() {
    panelVideo.classList.add('visible');
    document.body.classList.add('con-video');
    btnVideo.classList.add('activo');
    if (streamChico) return; // ya está abierta
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (sinCamaraChica) sinCamaraChica.textContent = '📷 Sin cámara';
      return;
    }
    try {
      streamChico = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (miCamaraChica) {
        miCamaraChica.srcObject = streamChico;
        miCamaraChica.style.display = 'block';
      }
      if (sinCamaraChica) sinCamaraChica.style.display = 'none';
    } catch (err) {
      if (sinCamaraChica) sinCamaraChica.textContent = '📷 Sin acceso';
    }
  }

  function cerrarVideo() {
    panelVideo.classList.remove('visible', 'minimizado');
    document.body.classList.remove('con-video');
    btnVideo.classList.remove('activo');
    if (streamChico) {
      streamChico.getTracks().forEach(t => t.stop());
      streamChico = null;
    }
  }

  if (btnVideo) btnVideo.addEventListener('click', () => {
    if (panelVideo.classList.contains('visible')) cerrarVideo();
    else abrirVideo();
  });
  if (btnCerrarVideo) btnCerrarVideo.addEventListener('click', cerrarVideo);
  if (btnMinimizar) btnMinimizar.addEventListener('click', () => {
    panelVideo.classList.toggle('minimizado');
    btnMinimizar.textContent = panelVideo.classList.contains('minimizado') ? '➕' : '➖';
  });
  if (btnMicChico) btnMicChico.addEventListener('click', () => {
    micChicoOn = !micChicoOn;
    btnMicChico.textContent = micChicoOn ? '🎤' : '🔇';
    btnMicChico.classList.toggle('apagado', !micChicoOn);
    if (streamChico) streamChico.getAudioTracks().forEach(t => t.enabled = micChicoOn);
  });
  if (btnCamChico) btnCamChico.addEventListener('click', () => {
    camChicoOn = !camChicoOn;
    btnCamChico.textContent = camChicoOn ? '📹' : '📷';
    btnCamChico.classList.toggle('apagado', !camChicoOn);
    if (streamChico) streamChico.getVideoTracks().forEach(t => t.enabled = camChicoOn);
  });

  // Al tocar el panel minimizado, se vuelve a abrir
  if (panelVideo) {
    panelVideo.addEventListener('click', e => {
      if (panelVideo.classList.contains('minimizado') && e.target === panelVideo) {
        panelVideo.classList.remove('minimizado');
        if (btnMinimizar) btnMinimizar.textContent = '➖';
      }
    });
  }
}

// =====================================================
// PÁGINA: videollamada.html — pantalla completa + MINI-CHAT
// =====================================================
if (pagina === 'videollamada.html') {
  const guardada = localStorage.getItem('amigaActual');
  if (guardada) amigaActual = JSON.parse(guardada);
  const nombreRemoto = document.getElementById('nombreRemoto');
  if (amigaActual && nombreRemoto) nombreRemoto.textContent = amigaActual.nombre;

  // --- Cámara a pantalla completa ---
  const miCamara = document.getElementById('miCamara');
  const sinCamara = document.getElementById('sinCamara');
  const tiempo = document.getElementById('tiempo');
  const btnMicrofono = document.getElementById('btnMicrofono');
  const btnCamara = document.getElementById('btnCamara');
  let streamCamara = null, segundos = 0, cronometro = null;
  let audioActivo = true, videoActivo = true;

  async function iniciarCamara() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (sinCamara) sinCamara.style.display = 'flex';
      return;
    }
    try {
      streamCamara = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (miCamara) { miCamara.srcObject = streamCamara; miCamara.style.display = 'block'; }
      if (sinCamara) sinCamara.style.display = 'none';
      cronometro = setInterval(() => {
        segundos++;
        const m = String(Math.floor(segundos / 60)).padStart(2, '0');
        const s = String(segundos % 60).padStart(2, '0');
        if (tiempo) tiempo.textContent = `${m}:${s}`;
      }, 1000);
    } catch (err) {
      if (sinCamara) sinCamara.style.display = 'flex';
    }
  }
  if (btnMicrofono) btnMicrofono.addEventListener('click', () => {
    audioActivo = !audioActivo;
    btnMicrofono.textContent = audioActivo ? '🎤' : '🔇';
    btnMicrofono.classList.toggle('apagado', !audioActivo);
    if (streamCamara) streamCamara.getAudioTracks().forEach(t => t.enabled = audioActivo);
  });
  if (btnCamara) btnCamara.addEventListener('click', () => {
    videoActivo = !videoActivo;
    btnCamara.textContent = videoActivo ? '📹' : '📷';
    btnCamara.classList.toggle('apagado', !videoActivo);
    if (streamCamara) streamCamara.getVideoTracks().forEach(t => t.enabled = videoActivo);
  });
  iniciarCamara();

  // --- MINI-CHAT dentro de la videollamada (escribir sin colgar) ---
  const miniChat = document.getElementById('miniChat');
  const miniChatCabecera = document.getElementById('miniChatCabecera');
  const miniMensajes = document.getElementById('miniMensajes');
  const miniForm = document.getElementById('miniForm');
  const miniEntrada = document.getElementById('miniEntrada');
  const miniChatFlecha = document.getElementById('miniChatFlecha');

  if (miniChatCabecera) {
    miniChatCabecera.addEventListener('click', () => {
      miniChat.classList.toggle('abierto');
      if (miniChatFlecha) miniChatFlecha.textContent = miniChat.classList.contains('abierto') ? '▼' : '▲';
      if (miniMensajes) miniMensajes.scrollTop = miniMensajes.scrollHeight;
    });
  }
  if (miniMensajes) {
    cargarMensajesEn(miniMensajes, 'mini-mensaje', 'hora-mensaje');
    escucharMensajes(miniMensajes, 'mini-mensaje', 'hora-mensaje');
  }
  if (miniForm && miniEntrada) {
    miniForm.addEventListener('submit', async e => {
      e.preventDefault();
      const texto = miniEntrada.value.trim();
      miniEntrada.value = '';
      await enviarMensaje(texto);
    });
  }
}

console.log('✅ Sala de Amigas — lista (PWA activa)');
