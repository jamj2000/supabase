
- [1. Qué es supabase y lenguajes en los que está escrito](#1-qué-es-supabase-y-lenguajes-en-los-que-está-escrito)
  - [1.1. Vista por áreas](#11-vista-por-áreas)
  - [1.2. ¿Qué lenguajes predominan realmente?](#12-qué-lenguajes-predominan-realmente)
- [2. Seguridad de Supabase](#2-seguridad-de-supabase)
  - [2.1. Roles](#21-roles)
  - [2.2. RLS](#22-rls)
  - [2.3. Políticas](#23-políticas)
- [3. API Key vs Bearer Token](#3-api-key-vs-bearer-token)
  - [3.1. ¿Puedo usar solo la API Key?](#31-puedo-usar-solo-la-api-key)
    - [3.1.1. ¿La API Key está destinada a aplicaciones cliente y el Bearer Token a usuarios?](#311-la-api-key-está-destinada-a-aplicaciones-cliente-y-el-bearer-token-a-usuarios)
  - [3.2. Resumen de uso en peticiones HTTP:](#32-resumen-de-uso-en-peticiones-http)
- [4. Consultas a la API REST](#4-consultas-a-la-api-rest)
  - [4.1. Tabla todos](#41-tabla-todos)
  - [4.2. Storage images](#42-storage-images)
    - [4.2.1. Crear bucket](#421-crear-bucket)
    - [4.2.2. Politicas](#422-politicas)
    - [4.2.3. Ejemplos de uso de la API REST de Storage](#423-ejemplos-de-uso-de-la-api-rest-de-storage)


---


Este proyecto muestra un ejemplo de aplicación que utiliza Supabase como backend. Para obtener información sobre Supabase, consulta los otros archivos de este repositorio.

Se hace usado Supabase auto-alojado con Docker Compose. Para su instalación se han seguido los pasos del tutorial https://docs.supabase.com/guides/self-hosting/docker




# 1. Qué es supabase y lenguajes en los que está escrito

Supabase es un BaaS (Backend as a Service) de código abierto.

Supabase no es un monolito; está compuesto por varios servicios independientes, muchos de ellos proyectos open source ya existentes. Los lenguajes principales son bastante variados: Go, Elixir, Haskell, TypeScript, Rust, Lua y C.

| Servicio                          | Lenguaje principal                 |
| --------------------------------- | ---------------------------------- |
| Supabase Studio (dashboard)       | TypeScript                         |
| Auth (GoTrue)                     | Go                                 |
| API REST (PostgREST)              | Haskell                            |
| Realtime                          | Elixir (sobre Erlang/Phoenix)      |
| Storage API                       | Node.js / TypeScript               |
| Edge Functions                    | TypeScript (ejecutadas sobre Deno) |
| postgres-meta                     | Node.js / TypeScript               |
| Supavisor (pooling de conexiones) | Elixir                             |
| PostgreSQL                        | C                                  |
| Kong API Gateway                  | Lua                                |
| pg_graphql                        | Rust                               |
| Deno Runtime                      | Principalmente Rust + TypeScript   |

## 1.1. Vista por áreas

**Base de datos**
- PostgreSQL → C.
- Muchas extensiones de PostgreSQL (como pgvector) también están escritas en C.

***Autenticación***
- GoTrue (el servicio de Auth) está escrito en Go. Es un fork del proyecto original de Netlify.

**APIs**
- PostgREST está escrito en Haskell. Es el componente que genera automáticamente la API REST a partir de PostgreSQL.
- pg_graphql está escrito en Rust.

**Tiempo real**
- Realtime está escrito en Elixir usando Phoenix, aprovechando el ecosistema Erlang para manejar millones de conexiones concurrentes.

**Almacenamiento**
- Storage API está implementado en Node.js/TypeScript.

**Funciones serverless**
- Las Edge Functions se programan en TypeScript/JavaScript y corren sobre Deno. Internamente Deno está desarrollado principalmente en Rust.

**Herramientas de administración**
- Studio (la interfaz web) → TypeScript/React.
- postgres-meta → TypeScript.
  

## 1.2. ¿Qué lenguajes predominan realmente?

Si miras el ecosistema completo de Supabase, los más importantes son:

1. **TypeScript** → Studio, Storage, Edge Functions, herramientas de gestión.
2. **Go** → Auth y algunos servicios de infraestructura.
3. **Elixir** → Realtime y Supavisor.
4. **PostgreSQL/C** → el núcleo de toda la plataforma.
5. **Haskell** → PostgREST.
6. **Rust** → componentes modernos como pg_graphql y Deno.

Una de las cosas curiosas de Supabase es precisamente que no intenta reescribir todo en un único lenguaje: suele adoptar el proyecto open source más sólido para cada problema y lo integra dentro de la plataforma.



# 2. Seguridad de Supabase

## 2.1. Roles

Los roles en PostgreSQL son grupos de permisos que se pueden asignar a usuarios. En Supabase, hay tres roles principales:

- `anon`: Rol público/anónimo, usuarios no autenticados.
- `authenticated`: Rol para usuarios autenticados.
- `service_role`: Rol para administradores.

## 2.2. RLS

Supabase permite un acceso a los datos cómodo y seguro desde el navegador, siempre que habilites RLS.

RLS debe estar siempre habilitado en cualquier tabla almacenada en un esquema expuesto. Por defecto, este es el esquema público.

RLS está habilitado por defecto en tablas creadas con el Editor de tablas en el panel de control. Si creas uno en SQL crudo o con el editor de SQL, recuerda habilitar RLS tú mismo y conceder solo los permisos que cada rol de Postgres necesita. 

```sql
GRANT SELECT ON <schema_name>.<table_name> TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON <schema_name>.<table_name> TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON <schema_name>.<table_name> TO service_role;
alter table <schema_name>.<table_name>
enable row level security;
```

## 2.3. Políticas

Permitir SELECT publico:

```sql
CREATE POLICY "Tabla todos: Permitir lectura publica" ON public.todos
FOR SELECT TO anon USING (true);

-- Para eliminar la politica:
-- DROP POLICY "Permitir lectura publica" ON public.todos;
```

Pemitir SELECT, INSERT, UPDATE, DELETE publicas:

```sql
CREATE POLICY "Tabla todos: permitir todo a anon" ON public.todos
FOR ALL TO anon USING (true);
```

Permitir SELECT, INSERT, UPDATE, DELETE a usuarios autenticados:

```sql
CREATE POLICY "Tabla todos: permitir todo a authenticated" ON public.todos
FOR ALL TO authenticated USING (true);
```

Permitir SELECT, INSERT, UPDATE, DELETE a usuarios admin:

```sql
CREATE POLICY "Tabla todos: permitir todo a admin" ON public.todos
FOR ALL TO admin USING (true);
```

Mostrar todas las políticas:

```sql
SELECT * FROM pg_policies WHERE tablename = 'todos';
```

# 3. API Key vs Bearer Token

## 3.1. ¿Puedo usar solo la API Key?

**Sí, puedes pasar únicamente la cabecera `apikey`** si estás realizando consultas públicas. 

Si envías una petición solo con la cabecera `apikey: <anon_key>` (sin la cabecera `Authorization`), el API Gateway (Kong) la aceptará y asumirá por defecto el rol público/anónimo (`anon`). Podrás leer todas las tablas que tengan RLS desactivado o que tengan una política que permita el acceso a usuarios `anon` (públicos).

---

### 3.1.1. ¿La API Key está destinada a aplicaciones cliente y el Bearer Token a usuarios?
Es una excelente forma de conceptualizarlo, pero técnicamente funcionan de forma combinada en Supabase:

*   **La cabecera `apikey` (Identifica al proyecto):**
    Es estática. Identifica a tu aplicación cliente y le dice al API Gateway (Kong) a qué base de datos y proyecto de Supabase debe dirigir la petición. **Siempre debe enviarse** en todas las peticiones (ya sea con la `anon_key` en el cliente o la `service_role_key` en el servidor).

*   **La cabecera `Authorization: Bearer <TOKEN>` (Identifica al usuario/sesión):**
    Es dinámica y define los permisos específicos (el rol y el usuario) de quien realiza la petición.
    *   **Si el usuario no ha iniciado sesión (Invitado):** El SDK de Supabase envía automáticamente la `anon_key` como Bearer Token (`Bearer <anon_key>`).
    *   **Si el usuario inicia sesión:** Supabase genera un token JWT personalizado para ese usuario. A partir de ese momento, el SDK de Supabase cambia el Bearer Token por el JWT del usuario (`Bearer <JWT_del_usuario>`). Así es como PostgreSQL y las políticas RLS saben exactamente qué usuario (`auth.uid()`) está intentando leer o escribir datos.

## 3.2. Resumen de uso en peticiones HTTP:

| Tipo de petición            | Cabecera `apikey`    | Cabecera `Authorization`               | ¿Qué permisos tiene?                                       |
| :-------------------------- | :------------------- | :------------------------------------- | :--------------------------------------------------------- |
| **Invitado / Pública**      | `<anon_key>`         | *No requerida* (o `Bearer <anon_key>`) | Rol `anon` (limitado por tus políticas RLS para anónimos)  |
| **Usuario Autenticado**     | `<anon_key>`         | `Bearer <JWT_del_usuario>`             | Rol `authenticated` (acceso a sus propios datos según RLS) |
| **Administrador (Backend)** | `<service_role_key>` | `Bearer <service_role_key>`            | Rol `service_role` (Acceso total, se salta RLS)            |


# 4. Consultas a la API REST


## 4.1. Tabla todos

Requisitos: 
- Crear una tabla en SQL.
- Habilitar RLS.
- Crear politicas para permitir el acceso a la tabla.

```sql
-- Crear tabla todos
CREATE TABLE public.todos (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
    -- completed BOOLEAN DEFAULT FALSE
);

-- Habilitar RLS
alter table todos
enable row level security;

-- Crear politicas para permitir el acceso a la tabla
CREATE POLICY "Tabla todos: permitir lectura publica" ON public.todos
FOR SELECT TO anon USING (true);

CREATE POLICY "Tabla todos: permitir todo a authenticated" ON public.todos
FOR ALL TO authenticated USING (true);
```


```sh
# Mostrar todos los registros
curl -X GET "http://localhost:8000/rest/v1/todos" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgwMTc5Mjc5LCJleHAiOjE5Mzc4NTkyNzl9.WQvCAWWScCUvV2UQjGS7WStM58JWpLuLqm_WRD8F144" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgwMTc5Mjc5LCJleHAiOjE5Mzc4NTkyNzl9.WQvCAWWScCUvV2UQjGS7WStM58JWpLuLqm_WRD8F144"
```

```sh
# Insertar registro
curl -X POST "http://localhost:8000/rest/v1/todos" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgwMTc5Mjc5LCJleHAiOjE5Mzc4NTkyNzl9.WQvCAWWScCUvV2UQjGS7WStM58JWpLuLqm_WRD8F144" \
  -H "Content-Type: application/json" \
  -d '{"name": "Hola world"}'
```


```sh
# Modificar registro insertado anteriormente
curl -X PATCH "http://localhost:8000/rest/v1/todos?id=eq.1" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgwMTc5Mjc5LCJleHAiOjE5Mzc4NTkyNzl9.WQvCAWWScCUvV2UQjGS7WStM58JWpLuLqm_WRD8F144" \
  -H "Content-Type: application/json" \
  -d '{"name": "Hola world modificado"}'
```

```sh
# Eliminar registro insertado anteriormente
curl -X DELETE "http://localhost:8000/rest/v1/todos?id=eq.1" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgwMTc5Mjc5LCJleHAiOjE5Mzc4NTkyNzl9.WQvCAWWScCUvV2UQjGS7WStM58JWpLuLqm_WRD8F144"
```

## 4.2. Storage images

Requisitos: 
- Crear una carpeta (bucket) en Storage.
- Crear politicas para permitir el acceso a los archivos.


### 4.2.1. Crear bucket

```sql
-- Crear una carpeta (bucket) en Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);
```


### 4.2.2. Politicas

https://supabase.com/docs/guides/storage/security/access-control

Una forma sencilla de empezar sería crear políticas RLS para las operaciones `SELECT`, `INSERT`, UPDATE y DELETE, y restringir las políticas para cumplir con tus requisitos de seguridad. Por ejemplo, se puede empezar con la siguiente política de INSERT:

```sql
create policy "Storage: permitir inserción a usuarios anonimos" ON storage.objects
for insert with check (true);
```

y modificarla para permitir únicamente a usuarios autenticados subir recursos a un bucket específico cambiándola por:

```sql
CREATE POLICY "Storage images: permitir inserción a usuarios autenticados en bucket images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');
```



**Otras ejemplos de políticas:**

```sql
-- Crear politica para permitir la visualización de los archivos
CREATE POLICY "Storage images: permitir visión de imágenes a usuarios autenticados en bucket images" ON storage.objects
FOR SELECT TO authenticated WITH CHECK (bucket_id = 'images');
```

```sql
-- Crear politica para permitir la eliminación de los archivos
CREATE POLICY "Storage images: permitir eliminar a usuarios autenticados en bucket images" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'images');
```

```sql
-- Crear politica para permitir la modificación de los archivos
CREATE POLICY "Storage images: permitir todo a usuarios autenticados en bucket images" ON storage.objects
FOR ALL TO authenticated USING (bucket_id = 'images');
```



```sql
-- Mostrar todas las políticas de storage.objects
SELECT * FROM pg_policies WHERE policyname LIKE 'Storage%';
```

### 4.2.3. Ejemplos de uso de la API REST de Storage



```sh
# Listar todos los archivos del bucket
curl -X POST "http://localhost:8000/storage/v1/object/list/images" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgwMTc5Mjc5LCJleHAiOjE5Mzc4NTkyNzl9.WQvCAWWScCUvV2UQjGS7WStM58JWpLuLqm_WRD8F144" \
  -H "Content-Type: application/json" \
  -d '{"prefix": ""}'
```


```sh
# Subir archivo
curl -X POST "http://localhost:8000/storage/v1/object/images/image.png" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgwMTc5Mjc5LCJleHAiOjE5Mzc4NTkyNzl9.WQvCAWWScCUvV2UQjGS7WStM58JWpLuLqm_WRD8F144" \
  -H "Content-Type: image/png" \
  --data-binary @assets/supabase-logo-icon.png   # para subir archivos locales
```

**URL para ver archivos públicos**  

```sh
## Ver imagen subida
http://localhost:8000/storage/v1/object/public/images/image.png
```

```sh
## Descargar archivo
curl -X GET "http://localhost:8000/storage/v1/object/images/image.png" \
  --output imagen-descargada.png \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgwMTc5Mjc5LCJleHAiOjE5Mzc4NTkyNzl9.WQvCAWWScCUvV2UQjGS7WStM58JWpLuLqm_WRD8F144" 
```


En caso de que se quiera subir la imagen modificada con el mismo nombre para reemplazar la anterior, se puede usar el comando:

```sh
# Subir archivo con el mismo nombre
curl -X PUT "http://localhost:8000/storage/v1/object/images/image.png" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgwMTc5Mjc5LCJleHAiOjE5Mzc4NTkyNzl9.WQvCAWWScCUvV2UQjGS7WStM58JWpLuLqm_WRD8F144" \
  -H "Content-Type: image/png" \
  --data-binary @assets/supabase-logo-icon.png
```


```sh
# Eliminar archivo
curl -X DELETE "http://localhost:8000/storage/v1/object/images/image.png" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgwMTc5Mjc5LCJleHAiOjE5Mzc4NTkyNzl9.WQvCAWWScCUvV2UQjGS7WStM58JWpLuLqm_WRD8F144"
```
