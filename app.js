// =====================================================
// SALA DE AMIGAS — Con Supabase Real
// =====================================================

// ---------- CONFIGURACIÓN ----------
const SUPABASE_URL = 'https://dkgnxbsvvbceaaoigexj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jRyyfbNuESxhU_TGhqKBgg_8VbxcjCZ';

// Inicializar Supabase UNA SOLA VEZ
const { createClient } = supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- VARIABLES GLOBALES ----------
let nombreUsuario = localStorage.getItem('nombreUsuario') || 'Anónima';
let userId = localStorage.getItem('userId');
if (!userId) {
  userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
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
    if (el && err) {
      el.classList.toggle('error', hayError);
      err.classList.toggle('visible', hayError);
    }
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
        textoExito.textContent = `¡Hola ${nombreUsuario}! Conectando...`;
        mensajeExito.classList.add('visible');
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
        textoExito.textContent = `¡Bienvenida, ${nombre}! 🎉`;
        mensajeExito.classList.add('visible');
        setTimeout(() => window.location.href = 'sala.html', 800);
      }
    });
  }
}

// =====================================================
// PÁGINA: sala.html
// =====================================================
if (pagina === 'sala.html') {
  const nombreUsuarioEl = document.getElementById('nombreUsuario');
  const saludoNombre = document.getElementById('saludoNombre');
  const listaPersonas = document.getElementById('listaPersonas');
  const buscador = document.getElementById('buscar');
  
  let filtroBuscar = '';

  if (nombreUsuarioEl) nombreUsuarioEl.textContent = nombreUsuario;
  if (saludoNombre) saludoNombre.textContent = nombreUsuario;

  async function actualizarMiEstado(enLinea) {
    await supabase.from('conectados').upsert({
      id: userId,
      nombre: nombreUsuario,
      en_linea: enLinea,
      ultima_vez: new Date().toISOString()
    });
  }

  actualizarMiEstado(true);

  window.addEventListener('beforeunload', () => {
    supabase.from('conectados').update({ en_linea: false }).eq('id', userId);
  });

  async function cargarConectados() {
    const hace5Minutos = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('conectados')
      .select('*')
      .eq('en_linea', true)
      .gte('ultima_vez', hace5Minutos);

    if (error) return console.error('Error:', error);
    dibujarSala(data || []);
  }

  function dibujarSala(personas) {
    if (!listaPersonas) return;
    listaPersonas.innerHTML = '';

    const personasFiltradas = personas
      .filter(p => p.id !== userId)
      .filter(p => p.nombre.toLowerCase().includes(filtroBuscar.toLowerCase()));

    if (personasFiltradas.length === 0) {
      listaPersonas.innerHTML = `
        <div style="text-align:center; padding:60px 20px; color:#888;">
          😴 Nadie más está conectado ahora mismo<br>
          <small>¡Comparte tu enlace con tus amigas para chatear de verdad!</small>
        </div>`;
      return;
    }

    personasFiltradas.forEach(p => {
      const div = document.createElement('div');
      div.className = 'persona';
      div.innerHTML = `
        <div class="avatar">
          👩
          <span class="punto-estado en-linea"></span>
        </div>
        <div class="info-persona">
          <div class="nombre-persona">${p.nombre}</div>
          <div class="estado-persona">🟢 Conectada ahora</div>
        </div>
        <span style="color:#ccc; font-weight:bold;">›</span>
      `;
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

  setInterval(() => actualizarMiEstado(true), 15000);

  supabase.channel('public:conectados')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conectados' }, cargarConectados)
    .subscribe();
  
  cargarConectados();
}

// =====================================================
// PÁGINA: chat.html
// =====================================================
if (pagina === 'chat.html') {
  const guardada = localStorage.getItem('amigaActual');
  chatIdActual = localStorage.getItem('chatIdActual');
  if (guardada) amigaActual = JSON.parse(guardada);

  const avatarAmiga = document.getElementById('avatarAmiga');
  const nombreAmiga = document.getElementById('nombreAmiga');
  const cajaMensajes = document.getElementById('cajaMensajes');
  const formMensaje = document.getElementById('formMensaje');
  const entradaMensaje = document.getElementById('entradaMensaje');

  if (amigaActual) {
    if (avatarAmiga) avatarAmiga.textContent = '👩';
    if (nombreAmiga) nombreAmiga.textContent = amigaActual.nombre;
  }

  function agregarMensaje(datos) {
    if (!cajaMensajes) return;
    const div = document.createElement('div');
    const esMio = datos.de === userId;
    div.className = `mensaje ${esMio ? 'enviado' : 'recibido'}`;
    
    const hora = new Date(datos.hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `
      <div class="texto-mensaje">${datos.texto}</div>
      <div class="hora-mensaje">${hora}</div>
    `;
    cajaMensajes.appendChild(div);
    cajaMensajes.scrollTop = cajaMensajes.scrollHeight;
  }

  async function cargarMensajes() {
    if (!chatIdActual) return;
    const { data, error } = await supabase
      .from('mensajes')
      .select('*')
      .eq('chat_id', chatIdActual)
      .order('hora', { ascending: true });

    if (error) return console.error('Error:', error);
    (data || []).forEach(agregarMensaje);
  }

  if (formMensaje && entradaMensaje) {
    formMensaje.addEventListener('submit', async e => {
      e.preventDefault();
      const texto = entradaMensaje.value.trim();
      if (!texto || !chatIdActual) return;
      
      entradaMensaje.value = '';
      
      await supabase.from('mensajes').insert({
        chat_id: chatIdActual,
        de: userId,
        de_nombre: nombreUsuario,
        texto: texto,
        hora: new Date().toISOString()
      });
    });
  }

  if (chatIdActual) {
    supabase.channel(chatIdActual)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
        filter: `chat_id=eq.${chatIdActual}`
      }, (payload) => agregarMensaje(payload.new))
      .subscribe();
    
    cargarMensajes();
  }
}

// =====================================================
// PÁGINA: videollamada.html
// =====================================================
if (pagina === 'videollamada.html') {
  const miCamara = document.getElementById('miCamara');
  const sinCamara = document.getElementById('sinCamara');
  const tiempo = document.getElementById('tiempo');
  const btnMicrofono = document.getElementById('btnMicrofono');
  const btnCamara = document.getElementById('btnCamara');

  let streamCamara = null;
  let segundos = 0;
  let cronometro = null;
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

  if (btnMicrofono) {
    btnMicrofono.addEventListener('click', () => {
      audioActivo = !audioActivo;
      btnMicrofono.textContent = audioActivo ? '🎤' : '🔇';
      if (streamCamara) {
        streamCamara.getAudioTracks().forEach(t => t.enabled = audioActivo);
      }
    });
  }

  if (btnCamara) {
    btnCamara.addEventListener('click', () => {
      videoActivo = !videoActivo;
      btnCamara.textContent = videoActivo ? '📹' : '📷';
      if (streamCamara) {
        streamCamara.getVideoTracks().forEach(t => t.enabled = videoActivo);
      }
    });
  }

  iniciarCamara();
}

console.log('✅ Sala de Amigas — Conectada y lista');
