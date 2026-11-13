# GesTask — Gestión Académica

Aplicación React/Vite conectada a Supabase. Mantiene los módulos existentes de proyectos y tareas e incorpora gestión académica para estudiantes, profesores, asignaturas, grupos, matrículas y calificaciones.

## Desarrollo local

1. Instala Node.js y las dependencias con `npm install`.
2. Copia `.env.example` a `.env` y configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores públicos de tu proyecto Supabase.
3. Ejecuta `npm run dev`.

No uses una clave `service_role` en el navegador ni en variables `VITE_*`.

## Preparar Supabase

Aplica `supabase/migrations/20261113000000_academic_management.sql` desde el SQL Editor de Supabase o con Supabase CLI enlazada al proyecto. La migración crea las tablas académicas, habilita RLS y aplica las políticas de acceso por rol.

Los usuarios se autentican mediante Supabase Auth y cada cuenta nueva recibe un perfil de estudiante. Para preparar cuentas de administrador o profesor para una demostración:

1. Crea/invita la cuenta desde Supabase Auth.
2. Enlaza su fila de `profiles` con una fila de `teachers` para profesores, y con una fila de `students` para estudiantes.
3. Asigna el rol `admin` o `teacher` a la fila correspondiente de `profiles` desde el SQL Editor como operador del proyecto. Nunca permitas que el cliente público modifique su propio rol.
4. Crea asignaturas, grupos, matrículas y notas desde la aplicación.

Por ejemplo, después de crear la cuenta en Auth, reemplaza el correo de ejemplo y ejecuta como operador:

```sql
update public.profiles set role = 'admin' where email = 'admin@example.edu';
```

Para un profesor, usa `role = 'teacher'`. Verifica que la consulta actualice exactamente una fila. No se crean cuentas ni contraseñas predeterminadas en esta migración.

La aplicación no crea usuarios administradores ni contraseñas predeterminadas. Las cuentas reales dependen del proyecto Supabase y deben aprovisionarse allí antes de la sustentación. El RLS también debe probarse en el proyecto desplegado: las restricciones de rutas de React son solo una capa adicional.

## Verificación

- `npm run lint`
- `npm run build`

En Vercel configura las mismas dos variables públicas de Supabase en los entornos que correspondan y vuelve a desplegar. El archivo `.env` local está excluido de Git; configura las variables de producción directamente en Vercel.
