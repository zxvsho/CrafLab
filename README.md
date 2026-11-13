# GesTask — Sistema de Gestión Académica

GesTask es una aplicación web para organizar la gestión académica de una institución educativa. Permite administrar estudiantes, profesores, asignaturas, grupos, matrículas y calificaciones, y conserva los módulos originales de proyectos y tareas.

## Funcionalidades

- **Administración:** gestión de estudiantes, profesores, asignaturas, grupos, matrículas y calificaciones, además de un panel de resumen académico.
- **Docentes:** consulta de grupos y estudiantes asignados, y registro y actualización de sus calificaciones.
- **Estudiantes:** consulta de sus propias matrículas, asignaturas y calificaciones.
- **Proyectos y tareas:** conserva las funciones existentes de organización y seguimiento de actividades.

## Tecnología y datos

La interfaz está desarrollada con React y Vite. El backend usa Supabase para autenticación, API REST y una base de datos PostgreSQL. El esquema académico está definido en `supabase/migrations/20261113000000_academic_management.sql`.

El acceso a la información se restringe por roles y políticas Row Level Security (RLS) en PostgreSQL, de modo que la seguridad no depende solo de ocultar opciones en la interfaz. El frontend se puede alojar en Vercel y conectarse al proyecto Supabase que contiene la base de datos.
