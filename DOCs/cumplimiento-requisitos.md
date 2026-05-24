# Cumplimiento de Requisitos del Proyecto Final PRG2

Documento actualizado a partir del archivo `DOCs/Trabajo Practico PRG2.pdf`.

## Veredicto General

El proyecto **cumple con el alcance minimo obligatorio** del trabajo practico final integrador.

La aplicacion no es solamente visual: ejecuta un servidor Node.js/Express, se conecta a Oracle XE en `XEPDB1`, autentica contra base de datos, realiza operaciones CRUD, persiste datos reales, muestra tablas/reportes y genera graficos dinamicos.

## Requisitos del PDF y Estado del Proyecto

| Requisito del PDF | Estado | Evidencia |
| --- | --- | --- |
| Aplicacion web funcional, academica y demostrable | Cumple | Sistema de gestion academica con alumnos, materias, inscripciones, dashboard y reportes. |
| Arquitectura cliente-servidor | Cumple | Frontend en `public/`; backend en `js/server.js`; base Oracle XE. |
| Frontend con HTML5, CSS3 y JavaScript | Cumple | `public/index.html`, `public/styles.css`, `public/app.js`. |
| Backend con Node.js + Express | Cumple | `js/server.js`, dependencias en `js/package.json`. |
| Base de datos Oracle XE local, preferentemente XEPDB1 | Cumple | `js/db.js` usa `localhost:1521/XEPDB1`. |
| Conexion Oracle con `oracledb` modo Thin | Cumple | Dependencia `oracledb`; conexion sin Oracle Client externo. |
| Pool de conexiones | Cumple | `oracledb.createPool()` en `js/server.js`. |
| Servicios web / endpoints CRUD | Cumple | Rutas `/api/alumnos`, `/api/materias`, `/api/inscripciones`, `/api/resumen`, `/api/login`. |
| Gestion de errores de base de datos | Cumple | Manejo de errores `ORA-01017`, `ORA-00942` y respuestas HTTP 500/401/400. |
| Base relacional con tablas | Cumple | `DOCs/schema.sql`. |
| Claves primarias | Cumple | Todas las tablas usan `PRIMARY KEY`. |
| Claves foraneas | Cumple | `prg2_inscripciones` referencia `prg2_alumnos` y `prg2_materias`. |
| Restricciones | Cumple | `UNIQUE`, `NOT NULL`, `CHECK`, `ON DELETE CASCADE`. |
| Datos de prueba | Cumple | Inserts iniciales en `DOCs/schema.sql`. |
| Al menos tres tablas relacionadas | Cumple | `prg2_usuarios`, `prg2_alumnos`, `prg2_materias`, `prg2_inscripciones`. |
| CRUD completo de al menos una entidad principal | Cumple | Alumnos tiene listar, crear, actualizar y eliminar. |
| Login funcional contra base de datos o autenticacion equivalente | Cumple | `POST /api/login` valida contra `prg2_usuarios`. |
| Reporte o tabla dinamica con datos reales de Oracle | Cumple | Reporte CSV y tablas cargadas desde endpoints conectados a Oracle. |
| Tablas con paginacion/filtro | Cumple | Tablas HTML con filtro en alumnos, materias e inscripciones. |
| Graficos dinamicos | Cumple | Graficos en Canvas generados desde `/api/resumen`. |
| Interfaz responsive | Cumple | Media queries en `public/styles.css`. |
| Formularios con validaciones HTML5 | Cumple | Inputs `required`, `type=email`, `type=number`, `min`, `max`, `step`. |
| Consumo de API mediante `fetch()` | Cumple | Funcion `api()` en `public/app.js`. |
| JavaScript moderno: funciones reutilizables, `const/let`, `async/await` | Cumple | `public/app.js` y `js/server.js`. |
| Operacion completa extremo a extremo | Cumple | Alta de alumno/inscripcion desde interfaz hasta Oracle. |
| Demostracion ejecutable con `npm run dev` | Cumple | Script `dev` agregado en `js/package.json`. |
| Organizacion y buenas practicas | Cumple | Separacion por carpetas: `public`, `js`, `DOCs`; SQL parametrizado; configuracion separada. |
| Seguridad basica | Cumple | Hash SHA-256, token de sesion, rutas protegidas y bind parameters. |

## Archivos Principales

| Archivo | Funcion |
| --- | --- |
| `public/index.html` | Estructura de la interfaz web. |
| `public/styles.css` | Diseno visual y responsive. |
| `public/app.js` | Logica frontend, consumo de API, filtros y graficos. |
| `js/server.js` | Backend Express, API REST, autenticacion, consultas Oracle y reportes. |
| `js/db.js` | Configuracion de conexion a Oracle XE. |
| `js/package.json` | Scripts `start`, `dev` y dependencias. |
| `DOCs/create-user.sql` | Creacion del usuario Oracle. |
| `DOCs/schema.sql` | Creacion de tablas y datos iniciales. |
| `DOCs/check-tables.sql` | Verificacion de tablas creadas. |

## Arquitectura del Sistema

```text
Navegador
  HTML5 + CSS3 + JavaScript
        |
        | fetch() + JSON + token
        v
Node.js + Express
        |
        | oracledb Thin + pool de conexiones
        v
Oracle XE XEPDB1
```

## Modulos Funcionales

### Login

El usuario ingresa con:

```text
Usuario: admin
Contrasena: admin123
```

El backend calcula el hash SHA-256 de la clave y consulta `prg2_usuarios`. Si la autenticacion es correcta, genera un token temporal y permite acceder a las rutas privadas.

### Dashboard

Consulta `/api/resumen` y muestra:

- Total de alumnos.
- Total de materias.
- Total de inscripciones.
- Promedio de notas.
- Grafico de inscripciones por materia.
- Grafico de estados de inscripcion.

### Alumnos

Entidad principal con CRUD completo:

- Crear alumno.
- Listar alumnos.
- Actualizar alumno.
- Eliminar alumno.
- Filtrar tabla.

### Materias

Permite:

- Crear materia.
- Listar materias.
- Eliminar materia.
- Filtrar tabla.

### Inscripciones

Permite:

- Registrar inscripcion entre alumno y materia.
- Listar inscripciones.
- Eliminar inscripcion.
- Filtrar tabla.

### Reportes

Incluye:

- Vista imprimible.
- Descarga CSV desde `/api/reportes/inscripciones.csv`.

## Comandos de Demostracion

Desde la carpeta `js`:

```powershell
cmd /c npm run dev
```

Tambien funciona:

```powershell
cmd /c npm start
```

Luego abrir:

```text
http://localhost:3000
```

## Puntos Fuertes Para Defender

- Cumple la condicion critica: hay conexion real a Oracle XE y persistencia real.
- Usa cuatro tablas, superando el minimo de tres.
- Tiene CRUD completo en la entidad principal `alumnos`.
- Usa endpoints REST claros.
- Usa consultas parametrizadas, reduciendo riesgo de SQL Injection.
- Incluye autenticacion funcional contra base de datos.
- Tiene dashboard, graficos, reportes y tablas filtrables.
- Puede demostrarse con `npm run dev`, como pide el PDF.

## Mejoras Opcionales

Estas mejoras no bloquean el cumplimiento, pero podrian subir la calidad:

- Reemplazar SHA-256 simple por `bcrypt`.
- Agregar paginacion numerada ademas del filtro.
- Usar Chart.js o ApexCharts si el docente exige una libreria externa especifica.
- Agregar confirmacion antes de eliminar registros.
- Crear un manual de usuario con capturas de pantalla.

## Conclusion

Segun los requisitos extraidos del PDF, el proyecto cumple con el objetivo general, los objetivos especificos, el alcance minimo obligatorio y las tecnologias obligatorias. Es una aplicacion web academica funcional, conectada a Oracle XE, con backend Node.js/Express, servicios REST, persistencia, login, reportes, tablas filtrables y graficos dinamicos.

