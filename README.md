# Gestion Academica PRG2

Aplicacion web academica para Programacion 2 con HTML5, CSS, JavaScript, Node.js, Express, Oracle XE, API REST, reportes CSV y graficos dinamicos en Canvas.

## Requisitos

- Node.js
- Oracle XE
- Usuario Oracle con permisos para crear tablas

## Base de datos

1. Entrar a Oracle como `SYSTEM` o un usuario administrador.
2. Ejecutar [DOCs/create-user.sql](DOCs/create-user.sql) para crear el usuario de la aplicacion.
3. Conectarse como `PRG2_APP` con contrasena `prg2_2026`.
4. Ejecutar [DOCs/schema.sql](DOCs/schema.sql) para crear tablas y datos iniciales.
5. Verificar las tablas con [DOCs/check-tables.sql](DOCs/check-tables.sql).
6. Configurar credenciales si son distintas a las predeterminadas:

```powershell
$env:ORACLE_USER="PRG2_APP"
$env:ORACLE_PASSWORD="prg2_2026"
$env:ORACLE_CONNECT_STRING="localhost:1521/XEPDB1"
```

## Ejecutar

```powershell
cd js
npm start
```

Abrir `http://localhost:3000`.

Si PowerShell bloquea `npm.ps1`, ejecutar con:

```powershell
cmd /c npm start
```

Usuario inicial:

- Usuario: `admin`
- Contrasena: `admin123`

## Modulos incluidos

- Login con clave hasheada.
- CRUD de alumnos.
- CRUD de materias.
- Registro de inscripciones.
- Dashboard con metricas y graficos dinamicos.
- Reporte imprimible y descarga CSV.
- API REST protegida con token.
