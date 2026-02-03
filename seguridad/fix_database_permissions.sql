-- ==============================================================================
-- FIX: TRIGGER AUTOMÁTICO PARA CREAR PERFILES
-- Este script soluciona el error "violates row-level security policy"
-- creando el perfil automáticamente con privilegios de sistema.
-- ==============================================================================

-- 1. Crear la función que se ejecutará cuando se crea un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer -- IMPORTANTE: Ejecuta con permisos de superusuario, ignora RLS
as $$
declare
  default_role public.app_role;
begin
  -- Determinar el rol basado en la metadata o por defecto 'guard'
  begin
    default_role := (new.raw_user_meta_data->>'role')::public.app_role;
  exception when others then
    default_role := 'guard';
  end;
  
  if default_role is null then
    default_role := 'guard';
  end if;

  insert into public.profiles (id, full_name, document_id, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario Sin Nombre'),
    coalesce(new.raw_user_meta_data->>'document_id', 'TEMP-' || floor(extract(epoch from now()))::text),
    default_role,
    true
  )
  on conflict (id) do update
  set 
    full_name = excluded.full_name,
    role = excluded.role;

  return new;
end;
$$;

-- 2. Eliminar el trigger si existe para evitar duplicados
drop trigger if exists on_auth_user_created on auth.users;

-- 3. Crear el trigger en la tabla de sistema auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Confirmación
select 'FIX APLICADO: Trigger handle_new_user creado correctamente.' as resultado;
