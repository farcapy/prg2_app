# Guia de Migracion a la Notebook de la Universidad

Esta guia explica como llevar el proyecto desde la computadora personal a la notebook donde se hara la presentacion, incluyendo aplicacion web, dependencias Node.js y base de datos Oracle XE.

## 1. Idea General

El sistema se migra en dos partes:

1. **Codigo de la aplicacion**: se obtiene desde GitHub.
2. **Base de datos**: se reconstruye en Oracle XE ejecutando los scripts SQL incluidos en `DOCs`.

No es necesario copiar `node_modules`. Esa carpeta se vuelve a generar con `npm install`.

Repositorio:

```text
https://github.com/farcapy/prg2_app
```

## 2. Requisitos en la Notebook

Antes de la presentacion, verificar que la notebook tenga:

- Git
- Node.js
- npm
- Oracle Database XE
- SQL*Plus
- Navegador web

Comandos de verificacion:

```powershell
git --version
node -v
npm -v
sqlplus -v
```

Si alguno falla, hay que instalarlo o usar la ruta completa del programa.

## 3. Clonar el Proyecto

Abrir PowerShell y elegir una carpeta de trabajo, por ejemplo `Documents`:

```powershell
cd C:\Users\TU_USUARIO\Documents
git clone https://github.com/farcapy/prg2_app.git
cd prg2_app
```

Si `git` no se reconoce, puede estar instalado pero fuera del PATH. En Windows normalmente se puede usar:

```powershell
& "C:\Program Files\Git\cmd\git.exe" clone https://github.com/farcapy/prg2_app.git
```

## 4. Instalar Dependencias Node.js

Entrar a la carpeta del backend:

```powershell
cd C:\Users\TU_USUARIO\Documents\prg2_app\js
npm install
```

Si PowerShell bloquea `npm.ps1`, usar:

```powershell
cmd /c npm install
```

## 5. Preparar Oracle XE

La aplicacion espera conectarse a:

```text
localhost:1521/XEPDB1
```

Usuario esperado:

```text
PRG2_APP
```

Contrasena esperada:

```text
prg2_2026
```

## 6. Crear Usuario de Base de Datos

Entrar a SQL*Plus como `SYSTEM` o usuario administrador.

Ejemplo:

```powershell
sqlplus system/TU_CLAVE_SYSTEM@localhost:1521/XEPDB1
```

Si no funciona, probar:

```powershell
sqlplus system/TU_CLAVE_SYSTEM@localhost:1521/XE
```

Una vez dentro, ejecutar:

```sql
@C:\Users\TU_USUARIO\Documents\prg2_app\DOCs\create-user.sql
```

Este script crea el usuario `PRG2_APP` y le da permisos basicos.

## 7. Crear Tablas y Datos Iniciales

Salir de SQL*Plus si estas como `SYSTEM`:

```sql
EXIT;
```

Entrar como usuario de la aplicacion:

```powershell
sqlplus PRG2_APP/prg2_2026@localhost:1521/XEPDB1
```

Ejecutar el esquema:

```sql
@C:\Users\TU_USUARIO\Documents\prg2_app\DOCs\schema.sql
```

Verificar que las tablas existan:

```sql
@C:\Users\TU_USUARIO\Documents\prg2_app\DOCs\check-tables.sql
```

Deberian aparecer:

```text
PRG2_ALUMNOS
PRG2_INSCRIPCIONES
PRG2_MATERIAS
PRG2_USUARIOS
```

## 8. Ejecutar la Aplicacion

Desde PowerShell:

```powershell
cd C:\Users\TU_USUARIO\Documents\prg2_app\js
npm run dev
```

Si PowerShell bloquea `npm.ps1`:

```powershell
cmd /c npm run dev
```

Abrir en el navegador:

```text
http://localhost:3000
```

Credenciales de la aplicacion:

```text
Usuario: admin
Contrasena: admin123
```

## 9. Checklist Antes de Presentar

Revisar esto antes de la defensa:

- Oracle XE esta iniciado.
- El usuario `PRG2_APP` existe.
- `schema.sql` fue ejecutado sin errores.
- `check-tables.sql` muestra las cuatro tablas.
- `npm install` fue ejecutado dentro de la carpeta `js`.
- `npm run dev` inicia el servidor.
- `http://localhost:3000` abre la aplicacion.
- Login `admin / admin123` funciona.
- Se puede crear un alumno.
- Se puede crear una inscripcion.
- El dashboard muestra datos.
- El reporte CSV descarga correctamente.

## 10. Errores Comunes y Soluciones

### Error: `git no se reconoce`

Git no esta instalado o no esta en el PATH.

Solucion:

```powershell
& "C:\Program Files\Git\cmd\git.exe" --version
```

Si funciona, usar esa ruta completa o agregar Git al PATH.

### Error: `npm no se reconoce`

Node.js no esta instalado o no esta en el PATH.

Solucion:

- Instalar Node.js.
- Cerrar y abrir PowerShell.
- Verificar con:

```powershell
node -v
npm -v
```

### Error: PowerShell bloquea `npm.ps1`

Mensaje tipico:

```text
No se puede cargar el archivo npm.ps1 porque la ejecucion de scripts esta deshabilitada
```

Solucion rapida:

```powershell
cmd /c npm install
cmd /c npm run dev
```

### Error: `ORA-01017`

Mensaje:

```text
ORA-01017: nombre de usuario/contrasena no validos
```

Causas posibles:

- La contrasena no coincide.
- Se esta conectando al servicio incorrecto.
- El usuario fue creado en otro contenedor.

Solucion:

Verificar conexion:

```powershell
sqlplus PRG2_APP/prg2_2026@localhost:1521/XEPDB1
```

Si no funciona, revisar si Oracle usa `XE`:

```powershell
sqlplus PRG2_APP/prg2_2026@localhost:1521/XE
```

Si `XE` funciona, ejecutar la app con:

```powershell
$env:ORACLE_CONNECT_STRING="localhost:1521/XE"
cmd /c npm run dev
```

### Error: `ORA-00942`

Mensaje:

```text
ORA-00942: la tabla o vista no existe
```

Causa:

El usuario conecta correctamente, pero las tablas no fueron creadas en ese usuario.

Solucion:

Entrar como `PRG2_APP` y ejecutar:

```sql
@C:\Users\TU_USUARIO\Documents\prg2_app\DOCs\schema.sql
```

Luego verificar:

```sql
@C:\Users\TU_USUARIO\Documents\prg2_app\DOCs\check-tables.sql
```

### Error: `ORA-12514` o `ORA-12505`

Causa:

El servicio Oracle indicado no existe o no esta registrado.

Soluciones:

Probar:

```powershell
sqlplus system/TU_CLAVE_SYSTEM@localhost:1521/XEPDB1
sqlplus system/TU_CLAVE_SYSTEM@localhost:1521/XE
```

Usar en la app el servicio que funcione:

```powershell
$env:ORACLE_CONNECT_STRING="localhost:1521/XE"
cmd /c npm run dev
```

### Error: `EADDRINUSE: address already in use :::3000`

Causa:

El puerto 3000 ya esta ocupado.

Solucion:

Usar otro puerto:

```powershell
$env:PORT="3001"
cmd /c npm run dev
```

Abrir:

```text
http://localhost:3001
```

### Error: Login incorrecto aunque la base conecta

Verificar que `schema.sql` haya insertado el usuario inicial:

```sql
SELECT usuario, nombre, rol FROM prg2_usuarios;
```

Debe existir:

```text
admin
```

La clave de la app es:

```text
admin123
```

## 11. Plan B Sin Internet

Si en la universidad no hay internet:

1. Llevar un ZIP del proyecto.
2. Llevar tambien la carpeta `js\node_modules` si no se podra ejecutar `npm install`.
3. Descomprimir en la notebook.
4. Ejecutar los scripts SQL.
5. Iniciar con:

```powershell
cd ruta\del\proyecto\js
cmd /c npm run dev
```

Recomendacion: aunque el proyecto este en GitHub, llevar un pendrive como respaldo.

## 12. Datos Para Tener a Mano

```text
Repositorio:
https://github.com/farcapy/prg2_app

Usuario Oracle:
PRG2_APP

Contrasena Oracle:
prg2_2026

Servicio Oracle esperado:
localhost:1521/XEPDB1

Usuario app:
admin

Contrasena app:
admin123

URL local:
http://localhost:3000
```

## 13. Orden Recomendado Para La Defensa

1. Mostrar que el servidor corre con `npm run dev`.
2. Abrir `http://localhost:3000`.
3. Iniciar sesion.
4. Mostrar dashboard y graficos.
5. Crear un alumno.
6. Crear una materia o usar una existente.
7. Registrar una inscripcion.
8. Mostrar que el dato aparece en tablas y dashboard.
9. Descargar o imprimir el reporte.
10. Explicar brevemente la arquitectura: navegador, Express, Oracle XE.
