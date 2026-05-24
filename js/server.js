const crypto = require('crypto');
const path = require('path');
const express = require('express');
const oracledb = require('oracledb');
const bodyParser = require('body-parser');
const dbConfig = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const sessions = new Map();
let pool;

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function createToken(user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    id: user.ID,
    usuario: user.USUARIO,
    nombre: user.NOMBRE,
    rol: user.ROL,
    createdAt: Date.now()
  });
  return token;
}

function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const headerToken = header.startsWith('Bearer ') ? header.slice(7) : '';
  const token = headerToken || req.query.token;
  const session = sessions.get(token);

  if (!session) {
    return res.status(401).json({ message: 'Sesion no valida' });
  }

  req.user = session;
  req.token = token;
  next();
}

async function withConnection(work) {
  let connection;
  try {
    connection = await pool.getConnection();
    return await work(connection);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.post('/api/login', async (req, res) => {
  const { usuario, clave } = req.body;

  if (!usuario || !clave) {
    return res.status(400).json({ message: 'Usuario y clave son obligatorios' });
  }

  try {
    const result = await withConnection((connection) =>
      connection.execute(
        `SELECT id, usuario, nombre, rol
           FROM prg2_usuarios
          WHERE usuario = :usuario
            AND clave_hash = :claveHash
            AND activo = 'S'`,
        { usuario, claveHash: hashPassword(clave) }
      )
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: 'Usuario o contrasena incorrectos' });
    }

    const user = result.rows[0];
    res.json({
      token: createToken(user),
      user: {
        id: user.ID,
        usuario: user.USUARIO,
        nombre: user.NOMBRE,
        rol: user.ROL
      }
    });
  } catch (err) {
    console.error(err);
    if (err.errorNum === 1017) {
      return res.status(500).json({
        message: 'Oracle rechazo el usuario o la contrasena configurados en js/db.js'
      });
    }
    if (err.errorNum === 942) {
      return res.status(500).json({
        message: 'Faltan tablas en Oracle. Ejecuta DOCs/schema.sql conectado como PRG2_APP en XEPDB1'
      });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/logout', requireAuth, (req, res) => {
  sessions.delete(req.token);
  res.json({ ok: true });
});

app.get('/api/resumen', requireAuth, async (req, res) => {
  try {
    const data = await withConnection(async (connection) => {
      const totals = await connection.execute(`
        SELECT
          (SELECT COUNT(*) FROM prg2_alumnos) alumnos,
          (SELECT COUNT(*) FROM prg2_materias) materias,
          (SELECT COUNT(*) FROM prg2_inscripciones) inscripciones,
          (SELECT ROUND(AVG(nota), 2) FROM prg2_inscripciones WHERE nota IS NOT NULL) promedio
        FROM dual
      `);

      const byMateria = await connection.execute(`
        SELECT m.nombre materia, COUNT(i.id) cantidad
          FROM prg2_materias m
          LEFT JOIN prg2_inscripciones i ON i.materia_id = m.id
         GROUP BY m.nombre
         ORDER BY m.nombre
      `);

      const byEstado = await connection.execute(`
        SELECT estado, COUNT(*) cantidad
          FROM prg2_inscripciones
         GROUP BY estado
         ORDER BY estado
      `);

      return {
        totals: totals.rows[0],
        byMateria: byMateria.rows,
        byEstado: byEstado.rows
      };
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'No se pudo obtener el resumen' });
  }
});

app.get('/api/alumnos', requireAuth, async (req, res) => {
  try {
    const result = await withConnection((connection) =>
      connection.execute(`
        SELECT id, nombre, documento, email, telefono,
               TO_CHAR(fecha_alta, 'YYYY-MM-DD') fecha_alta
          FROM prg2_alumnos
         ORDER BY id DESC
      `)
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'No se pudieron listar alumnos' });
  }
});

app.post('/api/alumnos', requireAuth, async (req, res) => {
  const { nombre, documento, email, telefono } = req.body;

  if (!nombre || !documento) {
    return res.status(400).json({ message: 'Nombre y documento son obligatorios' });
  }

  try {
    await withConnection((connection) =>
      connection.execute(
        `INSERT INTO prg2_alumnos (nombre, documento, email, telefono)
         VALUES (:nombre, :documento, :email, :telefono)`,
        { nombre, documento, email, telefono },
        { autoCommit: true }
      )
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'No se pudo guardar el alumno' });
  }
});

app.put('/api/alumnos/:id', requireAuth, async (req, res) => {
  const { nombre, documento, email, telefono } = req.body;

  try {
    await withConnection((connection) =>
      connection.execute(
        `UPDATE prg2_alumnos
            SET nombre = :nombre,
                documento = :documento,
                email = :email,
                telefono = :telefono
          WHERE id = :id`,
        { id: parseNumber(req.params.id), nombre, documento, email, telefono },
        { autoCommit: true }
      )
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'No se pudo actualizar el alumno' });
  }
});

app.delete('/api/alumnos/:id', requireAuth, async (req, res) => {
  try {
    await withConnection((connection) =>
      connection.execute(
        `DELETE FROM prg2_alumnos WHERE id = :id`,
        { id: parseNumber(req.params.id) },
        { autoCommit: true }
      )
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'No se pudo eliminar el alumno' });
  }
});

app.get('/api/materias', requireAuth, async (req, res) => {
  try {
    const result = await withConnection((connection) =>
      connection.execute(`
        SELECT id, nombre, codigo, creditos
          FROM prg2_materias
         ORDER BY nombre
      `)
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'No se pudieron listar materias' });
  }
});

app.post('/api/materias', requireAuth, async (req, res) => {
  const { nombre, codigo, creditos } = req.body;

  if (!nombre || !codigo) {
    return res.status(400).json({ message: 'Nombre y codigo son obligatorios' });
  }

  try {
    await withConnection((connection) =>
      connection.execute(
        `INSERT INTO prg2_materias (nombre, codigo, creditos)
         VALUES (:nombre, :codigo, :creditos)`,
        { nombre, codigo, creditos: parseNumber(creditos) || 0 },
        { autoCommit: true }
      )
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'No se pudo guardar la materia' });
  }
});

app.delete('/api/materias/:id', requireAuth, async (req, res) => {
  try {
    await withConnection((connection) =>
      connection.execute(
        `DELETE FROM prg2_materias WHERE id = :id`,
        { id: parseNumber(req.params.id) },
        { autoCommit: true }
      )
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'No se pudo eliminar la materia' });
  }
});

app.get('/api/inscripciones', requireAuth, async (req, res) => {
  try {
    const result = await withConnection((connection) =>
      connection.execute(`
        SELECT i.id, i.alumno_id, i.materia_id, a.nombre alumno, m.nombre materia,
               i.estado, i.nota, TO_CHAR(i.fecha, 'YYYY-MM-DD') fecha
          FROM prg2_inscripciones i
          JOIN prg2_alumnos a ON a.id = i.alumno_id
          JOIN prg2_materias m ON m.id = i.materia_id
         ORDER BY i.id DESC
      `)
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'No se pudieron listar inscripciones' });
  }
});

app.post('/api/inscripciones', requireAuth, async (req, res) => {
  const { alumnoId, materiaId, estado, nota } = req.body;

  if (!alumnoId || !materiaId) {
    return res.status(400).json({ message: 'Alumno y materia son obligatorios' });
  }

  try {
    await withConnection((connection) =>
      connection.execute(
        `INSERT INTO prg2_inscripciones (alumno_id, materia_id, estado, nota)
         VALUES (:alumnoId, :materiaId, :estado, :nota)`,
        {
          alumnoId: parseNumber(alumnoId),
          materiaId: parseNumber(materiaId),
          estado: estado || 'CURSANDO',
          nota: nota === '' || nota === undefined ? null : parseNumber(nota)
        },
        { autoCommit: true }
      )
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'No se pudo guardar la inscripcion' });
  }
});

app.delete('/api/inscripciones/:id', requireAuth, async (req, res) => {
  try {
    await withConnection((connection) =>
      connection.execute(
        `DELETE FROM prg2_inscripciones WHERE id = :id`,
        { id: parseNumber(req.params.id) },
        { autoCommit: true }
      )
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'No se pudo eliminar la inscripcion' });
  }
});

app.get('/api/reportes/inscripciones.csv', requireAuth, async (req, res) => {
  try {
    const result = await withConnection((connection) =>
      connection.execute(`
        SELECT a.nombre alumno, a.documento, m.nombre materia, i.estado,
               NVL(TO_CHAR(i.nota), '-') nota, TO_CHAR(i.fecha, 'YYYY-MM-DD') fecha
          FROM prg2_inscripciones i
          JOIN prg2_alumnos a ON a.id = i.alumno_id
          JOIN prg2_materias m ON m.id = i.materia_id
         ORDER BY a.nombre, m.nombre
      `)
    );

    const header = 'Alumno,Documento,Materia,Estado,Nota,Fecha';
    const lines = result.rows.map((row) =>
      [row.ALUMNO, row.DOCUMENTO, row.MATERIA, row.ESTADO, row.NOTA, row.FECHA]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-inscripciones.csv"');
    res.send([header, ...lines].join('\n'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'No se pudo generar el reporte' });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Recurso no encontrado' });
});

async function startServer() {
  try {
    pool = await oracledb.createPool({
      ...dbConfig,
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1
    });

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('No se pudo iniciar el servidor:', err);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  if (pool) {
    await pool.close(10);
  }
  process.exit(0);
});

startServer();
