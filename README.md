# Gestion Academica PRG2

Aplicacion web academica para Programacion 2 con HTML5, CSS, JavaScript, Node.js, Express, Oracle XE, API REST, reportes CSV y graficos dinamicos en Canvas.

## Funcionalidades

- Login contra Oracle XE con clave hasheada.
- Dashboard con metricas y graficos dinamicos.
- CRUD completo de alumnos.
- Gestion de materias e inscripciones.
- Tablas con filtros.
- Reporte imprimible y descarga CSV.
- API REST protegida con token.

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
npm run dev
```

Abrir `http://localhost:3000`.

Si PowerShell bloquea `npm.ps1`, ejecutar con:

```powershell
cmd /c npm run dev
```

Usuario inicial:

- Usuario: `admin`
- Contrasena: `admin123`

## Scripts

Desde la carpeta `js`:

```powershell
npm run dev
npm start
npm run check
```

## Documentacion

- [Cumplimiento de requisitos](DOCs/cumplimiento-requisitos.md)
- [Guia de migracion a la universidad](DOCs/guia-migracion-universidad.md)
- [Script de usuario Oracle](DOCs/create-user.sql)
- [Script de tablas y datos](DOCs/schema.sql)

## Errores comunes

- `ORA-01017`: revisar usuario, contrasena y servicio Oracle en `js/db.js`.
- `ORA-00942`: ejecutar `DOCs/schema.sql` conectado como `PRG2_APP`.
- `npm.ps1 bloqueado`: usar `cmd /c npm run dev`.
- Puerto ocupado: ejecutar con otra variable, por ejemplo `$env:PORT="3001"`.
