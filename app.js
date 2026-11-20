// =====================================================
// SALA DE AMIGAS — app.js (el cerebro) + WEBRTC (cámaras de las dos)
// Se ejecuta en TODAS las páginas.
// =====================================================

// ---------- CONFIGURACIÓN ----------
const SUPABASE_URL = 'https://dkgnxbsvvbceaaoigexj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jRyyfbNuESxhU_TGhqKBgg_8VbxcjCZ';

// Servidores públicos STUN (ayudan a que las cámaras se encuentren en internet)
const SERVIDORES_ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

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

// SEGURIDAD: convierte texto de usuario en texto plano (evita que un mensaje
// con código <script> se ejecute en el celular de la otra persona).
function escaparHtml(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

let supabaseClient;
if (typeof supabase !== 'undefined') {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// =====================================================
// PWA — se ejecuta en TODAS las páginas
// =====================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
let eventoInstalar = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  eventoInstalar = e;
  mostrarBotonInstalar();
});
function mostrarBotonInstalar() {
  if (document.querySelector('.boton-instalar')) return;
  const boton = document.createElement('button');
  boton.className = 'boton-instalar';
  boton.textContent = '📲 Instalar App';
  boton.addEventListener('click', () => {
    if (!eventoInstalar) return;
    eventoInstalar.prompt();
    eventoInstalar.userChoice.then(respuesta => {
      if (respuesta.outcome === 'accepted') boton.style.display = 'none';
      eventoInstalar = null;
    });
  });
  document.body.appendChild(boton);
}

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
      btnEntrar.classList.add('activa'); btnRegistrarse.classList.remove('activa');
      if (formEntrar) formEntrar.classList.add('visible');
      if (formRegistro) formRegistro.classList.remove('visible');
      if (mensajeExito) mensajeExito.classList.remove('visible');
    });
    btnRegistrarse.addEventListener('click', () => {
      btnRegistrarse.classList.add('activa'); btnEntrar.classList.remove('activa');
      if (formRegistro) formRegistro.classList.add('visible');
      if (formEntrar) formEntrar.classList.remove('visible');
      if (mensajeExito) mensajeExito.classList.remove('visible');
    });
  }
  function configurarOjo(botonId, inputId) {
    const boton = document.getElementById(botonId), input = document.getElementById(inputId);
    if (boton && input) boton.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      boton.textContent = input.type === 'password' ? '👁️' : '🙈';
    });
  }
  configurarOjo('btnOjo', 'clave'); configurarOjo('btnOjo2', 'claveReg');
  function mostrarError(elementoId, errorId, hayError) {
    const el = document.getElementById(elementoId), err = document.getElementById(errorId);
    if (el) el.classList.toggle('error', hayError);
    if (err) err.classList.toggle('visible', hayError);
    return !hayError;
  }
  if (formEntrar) formEntrar.addEventListener('submit', e => {
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
  if (formRegistro) formRegistro.addEventListener('submit', e => {
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
    } catch (e) {}
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
      listaPersonas.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#888;">😴 Nadie más está conectada ahora mismo<br><small>¡Comparte tu enlace con tus amigas!</small></div>`;
      return;
    }
    filtradas.forEach(p => {
      const div = document.createElement('div');
      div.className = 'persona';
      div.innerHTML = `<div class="avatar">👩</div><div class="info-persona"><div class="nombre-persona">${escaparHtml(p.nombre)}</div><div class="estado-persona">🟢 Conectada</div></div><span style="color:#ccc;font-weight:bold;">›</span>`;
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
  if (buscador) buscador.addEventListener('input', e => { filtroBuscar = e.target.value; cargarConectados(); });
  supabaseClient.channel('public:conectados')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conectados' }, cargarConectados)
    .subscribe();
  cargarConectados();
}

// =====================================================
// FUNCIONES COMPARTIDAS DE CHAT
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
  div.innerHTML = `<div>${escaparHtml(datos.texto)}</div><div class="${claseHora}">${hora}</div>`;
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
// WEBRTC — que se vean las DOS cámaras (la novedad)
// Analogía: Supabase es el "mensajero" que pasa notas entre las dos
// cámaras para que se encuentren; después hablan directamente.
// =====================================================
let pc = null;               // la conexión entre las dos cámaras
let streamLocal = null;      // mi cámara y micrófono
let canalSenales = null;     // suscripción a las señales en tiempo real

// Enviar una "nota" a la otra persona por la tabla `senales`
async function enviarSenal(tipo, cuerpo) {
  if (!supabaseClient || !chatIdActual || !amigaActual) return;
  try {
    await supabaseClient.from('senales').insert({
      chat_id: chatIdActual,
      de: userId,
      para: amigaActual.id,
      tipo: tipo,
      cuerpo: cuerpo,
      creado_at: new Date().toISOString()
    });
  } catch (e) { console.warn('No se pudo enviar señal:', e); }
}

// Cuando llega el video de la otra persona, mostrarlo y ocultar el avatar
function mostrarVideoRemoto(videoRemotoEl, stream) {
  if (!videoRemotoEl) return;
  videoRemotoEl.srcObject = stream;
  videoRemotoEl.style.display = 'block';
  videoRemotoEl.play().catch(() => {});
  // Ocultar el avatar y las ondas (ya hay video de verdad)
  const contenedor = videoRemotoEl.parentElement;
  if (contenedor) {
    contenedor.querySelectorAll('.avatar-remoto, .ondas, .nota-camara, .nombre-remoto').forEach(el => el.style.display = 'none');
  }
}

// Procesar una "nota" que me llegó
async function procesarSenal(senal) {
  if (!pc) return;
  try {
    if (senal.tipo === 'oferta' && pc.signalingState === 'stable') {
      // Me llaman: acepto la oferta y contesto con una respuesta
      await pc.setRemoteDescription(JSON.parse(senal.cuerpo));
      const respuesta = await pc.createAnswer();
      await pc.setLocalDescription(respuesta);
      await enviarSenal('respuesta', JSON.stringify(respuesta));
    } else if (senal.tipo === 'respuesta' && pc.signalingState === 'have-local-offer') {
      // La otra persona contestó mi llamada
      await pc.setRemoteDescription(JSON.parse(senal.cuerpo));
    } else if (senal.tipo === 'candidato') {
      // Datos para encontrar el camino más rápido
      await pc.addIceCandidate(JSON.parse(senal.cuerpo)).catch(() => {});
    }
  } catch (e) { console.warn('Error procesando señal:', e); }
}

// Escuchar notas en tiempo real (solo las que van dirigidas a mí)
function escucharSenales() {
  if (!supabaseClient || !chatIdActual || canalSenales) return;
  canalSenales = supabaseClient.channel('senales_' + chatIdActual + '_' + pagina)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'senales',
      filter: `chat_id=eq.${chatIdActual}`
    }, async payload => {
      const s = payload.new;
      if (s && s.para === userId) await procesarSenal(s);
    })
    .subscribe();
}

// Al abrir el video: revisar si la otra persona ya me llamó (oferta reciente)
async function revisarLlamadaPendiente() {
  if (!supabaseClient || !chatIdActual || !amigaActual) return false;
  const hace1Min = new Date(Date.now() - 60 * 1000).toISOString();
  const { data } = await supabaseClient
    .from('senales').select('*')
    .eq('chat_id', chatIdActual)
    .eq('de', amigaActual.id)
    .eq('tipo', 'oferta')
    .gte('creado_at', hace1Min)
    .order('creado_at', { ascending: false })
    .limit(1);
  if (data && data.length > 0) {
    await procesarSenal(data[0]);
    return true;
  }
  return false;
}

// Iniciar la conexión de video (la usan tanto el chat como la videollamada)
async function iniciarConexionVideo(videoRemotoEl, miStream) {
  if (pc) return; // ya hay una conexión
  if (!amigaActual) {
    const g = localStorage.getItem('amigaActual');
    if (g) amigaActual = JSON.parse(g);
  }
  streamLocal = miStream;
  escucharSenales();

  pc = new RTCPeerConnection(SERVIDORES_ICE);

  // Agregar mi cámara/micrófono a la conexión
  if (streamLocal) {
    streamLocal.getTracks().forEach(t => pc.addTrack(t, streamLocal));
  }

  // Cuando llega el video de la otra persona → mostrarlo
  pc.ontrack = evento => {
    mostrarVideoRemoto(videoRemotoEl, evento.streams[0]);
  };

  // Mi dirección de internet: enviársela a la otra persona
  pc.onicecandidate = evento => {
    if (evento.candidate) enviarSenal('candidato', JSON.stringify(evento.candidate));
  };

  // ¿La otra persona ya me llamó? Si sí, contesto. Si no, yo llamo.
  const yaLlamaron = await revisarLlamadaPendiente();
  if (!yaLlamaron) {
    try {
      const oferta = await pc.createOffer();
      await pc.setLocalDescription(oferta);
      await enviarSenal('oferta', JSON.stringify(oferta));
    } catch (e) { console.warn('No se pudo crear oferta:', e); }
  }
}

// Cerrar la conexión de video (colgar)
function cerrarConexionVideo() {
  if (pc) { try { pc.close(); } catch (e) {} pc = null; }
  if (streamLocal) { streamLocal.getTracks().forEach(t => t.stop()); streamLocal = null; }
  if (canalSenales && supabaseClient) {
    supabaseClient.removeChannel(canalSenales).catch(() => {});
    canalSenales = null;
  }
}

// =====================================================
// PÁGINA: chat.html — mensajes + VIDEO INTEGRADO (con WebRTC)
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

  // --- VIDEO INTEGRADO con WebRTC ---
  const btnVideo = document.getElementById('btnVideo');
  const panelVideo = document.getElementById('panelVideo');
  const miCamaraChica = document.getElementById('miCamaraChica');
  const sinCamaraChica = document.getElementById('sinCamaraChica');
  const btnMicChico = document.getElementById('btnMicChico');
  const btnCamChico = document.getElementById('btnCamChico');
  const btnMinimizar = document.getElementById('btnMinimizar');
  const btnCerrarVideo = document.getElementById('btnCerrarVideo');
  const camaraRemotaChica = document.getElementById('camaraRemotaChica');

  let micChicoOn = true, camChicoOn = true;

  async function abrirVideo() {
    panelVideo.classList.add('visible');
    document.body.classList.add('con-video');
    btnVideo.classList.add('activo');
    if (streamLocal) return; // ya abierta
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (sinCamaraChica) sinCamaraChica.textContent = '📷 Sin cámara';
      return;
    }
    try {
      streamLocal = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (miCamaraChica) { miCamaraChica.srcObject = streamLocal; miCamaraChica.style.display = 'block'; }
      if (sinCamaraChica) sinCamaraChica.style.display = 'none';
      // Conectar con la otra persona (WebRTC)
      iniciarConexionVideo(camaraRemotaChica, streamLocal);
    } catch (err) {
      if (sinCamaraChica) sinCamaraChica.textContent = '📷 Sin acceso';
    }
  }

  function cerrarVideo() {
    panelVideo.classList.remove('visible', 'minimizado');
    document.body.classList.remove('con-video');
    btnVideo.classList.remove('activo');
    cerrarConexionVideo();
    if (miCamaraChica) { miCamaraChica.srcObject = null; miCamaraChica.style.display = 'none'; }
    if (sinCamaraChica) { sinCamaraChica.style.display = 'flex'; sinCamaraChica.textContent = '📷'; }
    if (camaraRemotaChica) { camaraRemotaChica.style.display = 'none'; camaraRemotaChica.srcObject = null; }
    // Volver a mostrar el avatar
    if (panelVideo) panelVideo.querySelectorAll('.avatar-remoto, .ondas, .nota-camara, .nombre-remoto').forEach(el => el.style.display = '');
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
    if (streamLocal) streamLocal.getAudioTracks().forEach(t => t.enabled = micChicoOn);
  });
  if (btnCamChico) btnCamChico.addEventListener('click', () => {
    camChicoOn = !camChicoOn;
    btnCamChico.textContent = camChicoOn ? '📹' : '📷';
    btnCamChico.classList.toggle('apagado', !camChicoOn);
    if (streamLocal) streamLocal.getVideoTracks().forEach(t => t.enabled = camChicoOn);
  });
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
// PÁGINA: videollamada.html — pantalla completa + MINI-CHAT + WebRTC
// =====================================================
if (pagina === 'videollamada.html') {
  const guardada = localStorage.getItem('amigaActual');
  if (guardada) amigaActual = JSON.parse(guardada);
  const nombreRemoto = document.getElementById('nombreRemoto');
  if (amigaActual && nombreRemoto) nombreRemoto.textContent = amigaActual.nombre;

  const miCamara = document.getElementById('miCamara');
  const sinCamara = document.getElementById('sinCamara');
  const tiempo = document.getElementById('tiempo');
  const btnMicrofono = document.getElementById('btnMicrofono');
  const btnCamara = document.getElementById('btnCamara');
  const camaraRemota = document.getElementById('camaraRemota');
  let segundos = 0, cronometro = null, audioActivo = true, videoActivo = true;

  async function iniciarCamara() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (sinCamara) sinCamara.style.display = 'flex';
      return;
    }
    try {
      streamLocal = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (miCamara) { miCamara.srcObject = streamLocal; miCamara.style.display = 'block'; }
      if (sinCamara) sinCamara.style.display = 'none';
      cronometro = setInterval(() => {
        segundos++;
        const m = String(Math.floor(segundos / 60)).padStart(2, '0');
        const s = String(segundos % 60).padStart(2, '0');
        if (tiempo) tiempo.textContent = `${m}:${s}`;
      }, 1000);
      // Conectar con la otra persona (WebRTC)
      iniciarConexionVideo(camaraRemota, streamLocal);
    } catch (err) {
      if (sinCamara) sinCamara.style.display = 'flex';
    }
  }
  if (btnMicrofono) btnMicrofono.addEventListener('click', () => {
    audioActivo = !audioActivo;
    btnMicrofono.textContent = audioActivo ? '🎤' : '🔇';
    btnMicrofono.classList.toggle('apagado', !audioActivo);
    if (streamLocal) streamLocal.getAudioTracks().forEach(t => t.enabled = audioActivo);
  });
  if (btnCamara) btnCamara.addEventListener('click', () => {
    videoActivo = !videoActivo;
    btnCamara.textContent = videoActivo ? '📹' : '📷';
    btnCamara.classList.toggle('apagado', !videoActivo);
    if (streamLocal) streamLocal.getVideoTracks().forEach(t => t.enabled = videoActivo);
  });
  iniciarCamara();

  // Cerrar conexión al salir (botón colgar)
  window.addEventListener('beforeunload', cerrarConexionVideo);

  // --- MINI-CHAT ---
  const miniChat = document.getElementById('miniChat');
  const miniChatCabecera = document.getElementById('miniChatCabecera');
  const miniMensajes = document.getElementById('miniMensajes');
  const miniForm = document.getElementById('miniForm');
  const miniEntrada = document.getElementById('miniEntrada');
  const miniChatFlecha = document.getElementById('miniChatFlecha');
  if (miniChatCabecera) miniChatCabecera.addEventListener('click', () => {
    miniChat.classList.toggle('abierto');
    if (miniChatFlecha) miniChatFlecha.textContent = miniChat.classList.contains('abierto') ? '▼' : '▲';
    if (miniMensajes) miniMensajes.scrollTop = miniMensajes.scrollHeight;
  });
  if (miniMensajes) {
    cargarMensajesEn(miniMensajes, 'mini-mensaje', 'hora-mensaje');
    escucharMensajes(miniMensajes, 'mini-mensaje', 'hora-mensaje');
  }
  if (miniForm && miniEntrada) miniForm.addEventListener('submit', async e => {
    e.preventDefault();
    const texto = miniEntrada.value.trim();
    miniEntrada.value = '';
    await enviarMensaje(texto);
  });
}

console.log('✅ Sala de Amigas — lista (PWA + WebRTC activos)');
