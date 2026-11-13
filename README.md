# GesTask — Sistema de Gestión Académica

Aplicación web para administrar estudiantes, profesores, asignaturas, grupos, matrículas y calificaciones, conservando los módulos originales de proyectos y tareas.

## Arquitectura

- **Frontend:** React, Vite y React Router.
- **Backend y base de datos:** Supabase, que proporciona PostgreSQL, autenticación y API REST.
- **Autorización:** roles en `public.profiles` y políticas PostgreSQL Row Level Security (RLS).
- **Despliegue del frontend:** Vercel.

El navegador usa la API de Supabase con la clave pública `anon`/publishable. No se requiere un servidor Express ni una base de datos PostgreSQL adicional en Vercel. La clave pública no sustituye a RLS: las políticas de la base de datos son las que protegen los datos.

## Requisitos

- Node.js compatible con la versión de Vite instalada.
- Un proyecto Supabase.
- Para desplegar: una cuenta de GitHub con acceso al repositorio y una cuenta de Vercel.

## Desarrollo local

```bash
npm ci
cp .env.example .env
npm run dev
```

Configura `.env` con los datos del proyecto Supabase:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

El prefijo `VITE_` hace que esos valores estén disponibles en el navegador; por eso solo se debe usar la clave pública. **Nunca** incluyas una clave `service_role`, `secret` o una contraseña de PostgreSQL en el frontend, en variables `VITE_*` o en Git.

## Base de datos Supabase / PostgreSQL

La migración [20261113000000_academic_management.sql](./supabase/migrations/20261113000000_academic_management.sql) crea el esquema académico, activa RLS y define políticas de acceso. Incluye las tablas `profiles`, `students`, `teachers`, `subjects`, `groups`, `enrollments` y `grades`.

Si usas el proyecto Supabase de producción ya preparado para esta aplicación, la migración está aplicada y no necesitas crear otra base de datos. Para instalar en un proyecto Supabase nuevo:

1. Abre el **SQL Editor** del proyecto y ejecuta la migración, o enlaza Supabase CLI y aplica las migraciones versionadas:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

2. En **Authentication**, habilita el método de acceso que vayas a utilizar y crea o invita las cuentas de prueba.
3. Las cuentas nuevas tienen rol `student` por defecto. Un operador debe asignar `teacher` o `admin` desde un entorno confiable y asociar la cuenta a la fila correspondiente de `teachers` o `students`.
4. Comprueba los permisos con cuentas de cada rol antes de una demostración.

Ejemplo para promover una cuenta ya creada (ejecutar como operador en el SQL Editor; reemplazar el correo y verificar que se actualice exactamente una fila):

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.edu';
```

No se crean usuarios ni contraseñas predeterminadas. Nunca permitas que una cuenta pública se asigne su propio rol.

## Roles de la aplicación

- **Administrador:** gestiona estudiantes, profesores, asignaturas, grupos, matrículas y calificaciones; consulta el panel académico.
- **Profesor:** consulta sus grupos y estudiantes inscritos; administra calificaciones de sus grupos.
- **Estudiante:** consulta sus propias matrículas, asignaturas y calificaciones.

La interfaz ajusta la navegación al rol, y RLS aplica las restricciones en PostgreSQL. Ocultar una ruta o un botón no es una medida de seguridad por sí sola.

## Publicar en GitHub y desplegar en Vercel

El repositorio está en [github.com/zxvsho/CrafLab](https://github.com/zxvsho/CrafLab).

1. En Vercel, selecciona **Add New → Project** e importa `zxvsho/CrafLab`.
2. Deja **Root Directory** como `./` y usa el preset **Vite**. Los valores habituales son:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm ci`
3. En **Environment Variables**, agrega para Preview y Production:
   - `VITE_SUPABASE_URL`: URL del proyecto Supabase.
   - `VITE_SUPABASE_ANON_KEY`: clave pública `anon`/publishable del mismo proyecto.
4. Guarda las variables y vuelve a desplegar. Vite las incorpora durante el build.

Vercel ofrece una integración de Supabase, pero no es necesario provisionar una segunda base de datos. Si conectas la integración existente, verifica igualmente que las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén definidas; los nombres que la integración agrega pueden no llevar el prefijo `VITE_` que requiere esta aplicación.

## Comprobaciones

```bash
npm run lint
npm run build
```

Antes de una demostración, confirma el inicio de sesión, que cada cuenta tenga el perfil y las relaciones académicas requeridas, y que un usuario no pueda leer ni modificar datos fuera de su rol.
