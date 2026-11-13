# CrafLab — Sistema de Gestión Académica

CrafLab es una aplicación web para organizar la gestión académica de una institución educativa. Permite administrar estudiantes, profesores, asignaturas, grupos, matrículas y calificaciones, y conserva los módulos originales de proyectos y tareas.

## Funcionalidades

- **Administración:** gestión de estudiantes, profesores, asignaturas, grupos, matrículas y calificaciones, además de un panel de resumen académico.
- **Docentes:** consulta de grupos y estudiantes asignados, y registro y actualización de sus calificaciones.
- **Estudiantes:** consulta de sus propias matrículas, asignaturas y calificaciones.
- **Proyectos y tareas:** conserva las funciones existentes de organización y seguimiento de actividades.
- **Acceso por usuario:** al crear una cuenta se pide un solo nombre, que también sirve como usuario de acceso y nombre del perfil; el apellido es opcional y el correo se usa para registrar la cuenta.
- **Paletas visuales:** ofrece temas retro como Everforest, Dracula, Gruvbox, Rosé Pine, Tokyo Night, Catppuccin y Kanagawa, además de un tema claro. La tecla `T` abre el selector de temas.

## Tecnología y datos

La interfaz está desarrollada con React y Vite. El backend usa Supabase para autenticación, API REST y una base de datos PostgreSQL. La resolución privada del nombre de usuario se realiza mediante una Edge Function de Supabase. El esquema académico está definido en `supabase/migrations/20261113000000_academic_management.sql` y el acceso por usuario en `supabase/migrations/20261113010000_username_login.sql`.

El acceso a la información se restringe por roles y políticas Row Level Security (RLS) en PostgreSQL, de modo que la seguridad no depende solo de ocultar opciones en la interfaz. El frontend se puede alojar en Vercel y conectarse al proyecto Supabase que contiene la base de datos.
