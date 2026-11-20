-- =====================================================
-- SALA DE AMIGAS — SEGURIDAD contra hackers
-- Pega esto en el Editor de SQL de Supabase y dale a Run.
-- Qué hace: vuelve a poner el candado (RLS) pero con "ventanas"
-- que permiten leer y escribir mensajes, PERO NO BORRAR NI MODIFICAR.
-- =====================================================

-- 1. Volver a activar el candado en las tres tablas
alter table conectados enable row level security;
alter table mensajes enable row level security;
alter table senales enable row level security;

-- 2. Borrar políticas viejas (si existen) para no duplicar
drop policy if exists "conectados_leer" on conectados;
drop policy if exists "conectados_crear" on conectados;
drop policy if exists "conectados_actualizar" on conectados;
drop policy if exists "mensajes_leer" on mensajes;
drop policy if exists "mensajes_crear" on mensajes;
drop policy if exists "senales_leer" on senales;
drop policy if exists "senales_crear" on senales;

-- 3. Tabla "conectados" (quién está en línea): leer, crear y actualizar sí; borrar NO.
create policy "conectados_leer" on conectados for select using (true);
create policy "conectados_crear" on conectados for insert with check (true);
create policy "conectados_actualizar" on conectados for update using (true);

-- 4. Tabla "mensajes" (el chat): leer y crear sí; editar y borrar NO.
create policy "mensajes_leer" on mensajes for select using (true);
create policy "mensajes_crear" on mensajes for insert with check (true);

-- 5. Tabla "senales" (WebRTC): leer y crear sí; editar y borrar NO.
create policy "senales_leer" on senales for select using (true);
create policy "senales_crear" on senales for insert with check (true);

-- Listo. Ahora un hacker con la llave pública puede leer y escribir,
-- pero NO puede borrar tus mensajes ni modificarlos.
