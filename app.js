// =====================================================
// SALA DE AMIGAS — Lógica completa multiplataforma
// =====================================================

const SUPABASE_URL = 'https://dkgnxbsvvbceaaoigexj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jRyyfbNuESxhU_TGhqKBgg_8VbxcjCZ';

let nombreUsuario = localStorage.getItem('nombreUsuario') || 'Anónima';
let userId = localStorage.getItem('userId');
if (!userId) {
  userId = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  localStorage.setItem('userId', userId);
}
let amigaActual = null;
let chatIdActual = null;
const pagina = window.location.pathname.split('/').pop() || 'index.html';

function generarChatId(id1, id2) {
  return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
}

function correoValido(texto) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
}

// =====================================================
// MODO CLARO / OSCURO (en todas las páginas)
// =====================================================
const btnTema = document.getElementById('btnTema');
if (localStorage.getItem('temaOscuro') === 'true') {
  document.body.classList.add('oscuro');
  if (btnTema) btnTema.textContent = '☀️';
}
if (btnTema) {
  btnTema.addEventListener('click', () => {
    const esOscuro = document.body.classList.toggle('oscuro');
    localStorage.setItem('temaOscuro', esOscuro);
    btnTema.textContent = esOscuro ? '☀️' : '🌙';
  });
}

// =====================================================
// SERVICE WORKER PWA (registro desde cualquier página)
// =====================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

// =====================================================
// SUPABASE
// =====================================================
let supabaseClient = null;
if (typeof supabase !== 'undefined') {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else if (pagina === 'sala.html' || pagina === 'chat.html') {
  console.error('❌ Supabase no está cargado. Revisa el orden de los scripts.');
}

async function actualizarMiEstado(enLinea) {
  if (!supabaseClient) return;
  await supabaseClient.from('conectados').upsert({
    id: userId,
    nombre: nombreUsuario,
    en_linea: enLinea,
    ultima_vez: new Date().toISOString()
  });
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

  function activarPestaña(modo) {
    const esRegistro = modo === 'registro';
    if (btnEntrar) btnEntrar.classList.toggle('activa', !esRegistro);
    if (btnRegistrarse) btnRegistrarse.classList.toggle('activa', esRegistro);
    if (formEntrar) formEntrar.classList.toggle('visible', !esRegistro);
    if (formRegistro) formRegistro.classList.toggle('visible', esRegistro);
    if (mensajeExito) mensajeExito.classList.remove('visible');
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('modo') === 'registro') {
    activarPestaña('registro');
  }

  if (btnEntrar) btnEntrar.addEventListener('click', () => activarPestaña('entrar'));
  if (btnRegistrarse) btnRegistrarse.addEventListener('click', () => activarPestaña('registro'));

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
        if (textoExito) textoExito.textContent = `¡Hola ${nombreUsuario}! Conectando...`;
        if (mensajeExito) mensajeExito.classList.add('visible');
        setTimeout(() => window.location.href = 'sala.html', 600);
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
        setTimeout(() => window.location.href = 'sala.html', 600);
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
  const btnSalir = document.getElementById('btnSalir');

  let filtroBuscar = '';
  let personasEnLinea = [];

  if (nombreUsuarioEl) nombreUsuarioEl.textContent = nombreUsuario;
  if (saludoNombre) saludoNombre.textContent = nombreUsuario;

  actualizarMiEstado(true);

  if (btnSalir) {
    btnSalir.addEventListener('click', async e => {
      e.preventDefault();
      await actualizarMiEstado(false);
      window.location.href = 'login.html';
    });
  }

  async function cargarConectados() {
    const hace5Minutos = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data, error } = await supabaseClient
      .from('conectados')
      .select('*')
      .eq('en_linea', true)
      .gte('ultima_vez', hace5Minutos);

    if (error) return console.error('Error:', error);
    personasEnLinea = data || [];
    dibujarSala();
  }

  function dibujarSala() {
    if (!listaPersonas) return;
    listaPersonas.innerHTML = '';

    const personasFiltradas = personasEnLinea
      .filter(p => p.id !== userId)
      .filter(p => (p.nombre || '').toLowerCase().includes(filtroBuscar.toLowerCase()));

    if (personasFiltradas.length === 0) {
      const vacio = document.createElement('div');
      vacio.className = 'sin-resultados';
      vacio.innerHTML = '<span class="emoji">😴</span>Nadie más está conectado ahora mismo<br><small>¡Comparte tu enlace con tus amigas para chatear!</small>';
      listaPersonas.appendChild(vacio);
      return;
    }

    personasFiltradas.forEach(p => {
      const div = document.createElement('div');
      div.className = 'persona';

      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = '👩';
      const punto = document.createElement('span');
      punto.className = 'estado';
      avatar.appendChild(punto);

      const info = document.createElement('div');
      info.className = 'info-persona';

      const nombre = document.createElement('div');
      nombre.className = 'nombre-persona';
      nombre.textContent = p.nombre || 'Amiga';

      const estado = document.createElement('div');
      estado.className = 'estado-persona';
      estado.textContent = '🟢 Conectada';

      const flecha = document.createElement('span');
      flecha.className = 'flecha';
      flecha.textContent = '›';

      info.appendChild(nombre);
      info.appendChild(estado);
      div.appendChild(avatar);
      div.appendChild(info);
      div.appendChild(flecha);

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
      dibujarSala();
    });
  }

  setInterval(() => actualizarMiEstado(true), 20000);

  supabaseClient.channel('public:conectados')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conectados' }, cargarConectados)
    .subscribe();

  cargarConectados();
}

// =====================================================
// PÁGINA: chat.html (50% cámara / 50% mensajes)
// =====================================================
if (pagina === 'chat.html' && supabaseClient) {
  const guardada = localStorage.getItem('amigaActual');
  chatIdActual = localStorage.getItem('chatIdActual');
  if (guardada) amigaActual = JSON.parse(guardada);

  const nombreAmiga = document.getElementById('nombreAmiga');
  const nombreRemoto = document.getElementById('nombreRemoto');
  const cajaMensajes = document.getElementById('cajaMensajes');
  const formMensaje = document.getElementById('formMensaje');
  const entradaMensaje = document.getElementById('entradaMensaje');

  const btnToggleCamara = document.getElementById('btnToggleCamara');
  const miCamara = document.getElementById('miCamara');
  const sinCamara = document.getElementById('sinCamara');
  const tiempo = document.getElementById('tiempo');
  const btnMicrofono = document.getElementById('btnMicrofono');
  const btnCamara = document.getElementById('btnCamara');
  const btnColgar = document.getElementById('btnColgar');

  let streamCamara = null;
  let segundos = 0;
  let cronometro = null;
  let audioActivo = true;
  let videoActivo = true;

  actualizarMiEstado(true);
  setInterval(() => actualizarMiEstado(true), 20000);

  if (amigaActual) {
    if (nombreAmiga) nombreAmiga.textContent = amigaActual.nombre;
    if (nombreRemoto) nombreRemoto.textContent = amigaActual.nombre;
  }

  if (!chatIdActual && cajaMensajes) {
    const aviso = document.createElement('div');
    aviso.className = 'sin-resultados';
    aviso.innerHTML = '<span class="emoji">💬</span>Elige una amiga desde la sala para empezar a chatear';
    cajaMensajes.appendChild(aviso);
  }

  function agregarMensaje(datos) {
    if (!cajaMensajes) return;
    const div = document.createElement('div');
    const esMio = datos.de === userId;
    div.className = `mensaje ${esMio ? 'enviado' : 'recibido'}`;

    const textoDiv = document.createElement('div');
    textoDiv.className = 'texto-mensaje';
    textoDiv.textContent = datos.texto;

    const horaDiv = document.createElement('div');
    horaDiv.className = 'hora-mensaje';
    horaDiv.textContent = new Date(datos.hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.appendChild(textoDiv);
    div.appendChild(horaDiv);
    cajaMensajes.appendChild(div);
    cajaMensajes.scrollTop = cajaMensajes.scrollHeight;
  }

  async function cargarMensajes() {
    if (!chatIdActual) return;
    const { data, error } = await supabaseClient
      .from('mensajes')
      .select('*')
      .eq('chat_id', chatIdActual)
      .order('hora', { ascending: true });

    if (error) return console.error('Error:', error);
    if (cajaMensajes) cajaMensajes.innerHTML = '';
    (data || []).forEach(agregarMensaje);
  }

  if (formMensaje && entradaMensaje) {
    formMensaje.addEventListener('submit', async e => {
      e.preventDefault();
      const texto = entradaMensaje.value.trim();
      if (!texto || !chatIdActual) return;

      entradaMensaje.value = '';
      await supabaseClient.from('mensajes').insert({
        chat_id: chatIdActual,
        de: userId,
        de_nombre: nombreUsuario,
        texto: texto,
        hora: new Date().toISOString()
      });
    });
  }

  if (chatIdActual) {
    supabaseClient.channel(chatIdActual)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
        filter: `chat_id=eq.${chatIdActual}`
      }, payload => agregarMensaje(payload.new))
      .subscribe();

    cargarMensajes();
  }

  async function iniciarCamaraDividida() {
    document.body.classList.add('camara-activa');
    if (cajaMensajes) cajaMensajes.scrollTop = cajaMensajes.scrollHeight;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (sinCamara) {
        sinCamara.textContent = '📷 Cámara no disponible';
        sinCamara.style.display = 'flex';
      }
      return;
    }

    try {
      streamCamara = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (miCamara) {
        miCamara.srcObject = streamCamara;
        miCamara.style.display = 'block';
      }
      if (sinCamara) sinCamara.style.display = 'none';

      segundos = 0;
      clearInterval(cronometro);
      cronometro = setInterval(() => {
        segundos++;
        const m = String(Math.floor(segundos / 60)).padStart(2, '0');
        const s = String(segundos % 60).padStart(2, '0');
        if (tiempo) tiempo.textContent = `${m}:${s}`;
      }, 1000);
    } catch (err) {
      if (sinCamara) {
        sinCamara.textContent = '📷 Sin permiso de cámara';
        sinCamara.style.display = 'flex';
      }
    }
  }

  function detenerCamaraDividida() {
    document.body.classList.remove('camara-activa');
    clearInterval(cronometro);
    cronometro = null;
    segundos = 0;
    if (tiempo) tiempo.textContent = '00:00';

    if (streamCamara) {
      streamCamara.getTracks().forEach(t => t.stop());
      streamCamara = null;
    }
    if (miCamara) miCamara.srcObject = null;
    if (sinCamara) {
      sinCamara.textContent = '📷 Iniciando cámara...';
      sinCamara.style.display = 'flex';
    }

    audioActivo = true;
    videoActivo = true;
    if (btnMicrofono) {
      btnMicrofono.textContent = '🎤';
      btnMicrofono.classList.remove('apagado');
    }
    if (btnCamara) {
      btnCamara.textContent = '📹';
      btnCamara.classList.remove('apagado');
    }
  }

  if (btnToggleCamara) {
    btnToggleCamara.addEventListener('click', () => {
      if (document.body.classList.contains('camara-activa')) {
        detenerCamaraDividida();
      } else {
        iniciarCamaraDividida();
      }
    });
  }

  if (btnColgar) btnColgar.addEventListener('click', detenerCamaraDividida);

  if (btnMicrofono) {
    btnMicrofono.addEventListener('click', () => {
      audioActivo = !audioActivo;
      btnMicrofono.textContent = audioActivo ? '🎤' : '🔇';
      btnMicrofono.classList.toggle('apagado', !audioActivo);
      if (streamCamara) {
        streamCamara.getAudioTracks().forEach(t => t.enabled = audioActivo);
      }
    });
  }

  if (btnCamara) {
    btnCamara.addEventListener('click', () => {
      videoActivo = !videoActivo;
      btnCamara.textContent = videoActivo ? '📹' : '📷';
      btnCamara.classList.toggle('apagado', !videoActivo);
      if (streamCamara) {
        streamCamara.getVideoTracks().forEach(t => t.enabled = videoActivo);
      }
      if (miCamara) miCamara.style.display = videoActivo ? 'block' : 'none';
      if (sinCamara) {
        sinCamara.textContent = '📷 Cámara apagada';
        sinCamara.style.display = videoActivo ? 'none' : 'flex';
      }
    });
  }
}

// =====================================================
// PÁGINA: videollamada.html
// =====================================================
if (pagina === 'videollamada.html') {
  const guardada = localStorage.getItem('amigaActual');
  const nombreRemoto = document.getElementById('nombreRemoto');
  if (guardada && nombreRemoto) {
    nombreRemoto.textContent = JSON.parse(guardada).nombre || 'Amiga';
  }

  const miCamara = document.getElementById('miCamara');
  const sinCamara = document.getElementById('sinCamara');
  const tiempo = document.getElementById('tiempo');
  const btnMicrofono = document.getElementById('btnMicrofono');
  const btnCamara = document.getElementById('btnCamara');

  let streamCamara = null;
  let segundos = 0;
  let audioActivo = true;
  let videoActivo = true;

  async function iniciarCamara() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (sinCamara) sinCamara.style.display = 'flex';
      return;
    }

    try {
      streamCamara = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (miCamara) {
        miCamara.srcObject = streamCamara;
        miCamara.style.display = 'block';
      }
      if (sinCamara) sinCamara.style.display = 'none';

      setInterval(() => {
        segundos++;
        const m = String(Math.floor(segundos / 60)).padStart(2, '0');
        const s = String(segundos % 60).padStart(2, '0');
        if (tiempo) tiempo.textContent = `${m}:${s}`;
      }, 1000);
    } catch (err) {
      if (sinCamara) {
        sinCamara.textContent = '📷 Sin permiso de cámara';
        sinCamara.style.display = 'flex';
      }
    }
  }

  if (btnMicrofono) {
    btnMicrofono.addEventListener('click', () => {
      audioActivo = !audioActivo;
      btnMicrofono.textContent = audioActivo ? '🎤' : '🔇';
      btnMicrofono.classList.toggle('apagado', !audioActivo);
      if (streamCamara) {
        streamCamara.getAudioTracks().forEach(t => t.enabled = audioActivo);
      }
    });
  }

  if (btnCamara) {
    btnCamara.addEventListener('click', () => {
      videoActivo = !videoActivo;
      btnCamara.textContent = videoActivo ? '📹' : '📷';
      btnCamara.classList.toggle('apagado', !videoActivo);
      if (streamCamara) {
        streamCamara.getVideoTracks().forEach(t => t.enabled = videoActivo);
      }
      if (miCamara) miCamara.style.display = videoActivo ? 'block' : 'none';
      if (sinCamara) {
        sinCamara.textContent = '📷 Cámara apagada';
        sinCamara.style.display = videoActivo ? 'none' : 'flex';
      }
    });
  }

  iniciarCamara();
}