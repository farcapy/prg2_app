const state = {
  token: localStorage.getItem('prg2_token'),
  user: JSON.parse(localStorage.getItem('prg2_user') || 'null'),
  alumnos: [],
  materias: [],
  inscripciones: []
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let messageTimer;

function showMessage(text, target = '#appMessage', type = 'error') {
  const element = $(target);
  element.textContent = text || '';
  element.classList.remove('success', 'error');

  if (text) {
    element.classList.add(type);
  }

  if (target === '#appMessage') {
    clearTimeout(messageTimer);
    if (text && type === 'success') {
      messageTimer = setTimeout(() => showMessage(''), 3500);
    }
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error inesperado' }));
    throw new Error(error.message || 'Error inesperado');
  }

  return response.status === 204 ? null : response.json();
}

function setAuthenticated(user, token) {
  state.user = user;
  state.token = token;
  localStorage.setItem('prg2_token', token);
  localStorage.setItem('prg2_user', JSON.stringify(user));
  $('#loginPanel').classList.add('hidden');
  $('#appPanel').classList.remove('hidden');
  $('#userName').textContent = user.nombre;
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('prg2_token');
  localStorage.removeItem('prg2_user');
  $('#appPanel').classList.add('hidden');
  $('#loginPanel').classList.remove('hidden');
  showMessage('', '#loginMessage');
}

function confirmAction(message) {
  return window.confirm(message);
}

function action(label, className, attrs = '') {
  return `<button class="${className}" ${attrs}>${label}</button>`;
}

function renderAlumnos() {
  $('#alumnosTable').innerHTML = state.alumnos.map((alumno) => `
    <tr>
      <td>${alumno.NOMBRE}</td>
      <td>${alumno.DOCUMENTO}</td>
      <td>${alumno.EMAIL || '-'}</td>
      <td>${alumno.TELEFONO || '-'}</td>
      <td>
        ${action('Editar', 'secondary', `data-edit-alumno="${alumno.ID}"`)}
        ${action('Eliminar', 'danger', `data-delete-alumno="${alumno.ID}"`)}
      </td>
    </tr>
  `).join('');

  $('#inscripcionForm select[name="alumnoId"]').innerHTML = '<option value="">Alumno</option>' +
    state.alumnos.map((alumno) => `<option value="${alumno.ID}">${alumno.NOMBRE}</option>`).join('');
}

function renderMaterias() {
  $('#materiasTable').innerHTML = state.materias.map((materia) => `
    <tr>
      <td>${materia.NOMBRE}</td>
      <td>${materia.CODIGO}</td>
      <td>${materia.CREDITOS}</td>
      <td>${action('Eliminar', 'danger', `data-delete-materia="${materia.ID}"`)}</td>
    </tr>
  `).join('');

  $('#inscripcionForm select[name="materiaId"]').innerHTML = '<option value="">Materia</option>' +
    state.materias.map((materia) => `<option value="${materia.ID}">${materia.NOMBRE}</option>`).join('');
}

function renderInscripciones() {
  $('#inscripcionesTable').innerHTML = state.inscripciones.map((item) => `
    <tr>
      <td>${item.ALUMNO}</td>
      <td>${item.MATERIA}</td>
      <td>${item.ESTADO}</td>
      <td>${item.NOTA || '-'}</td>
      <td>${item.FECHA}</td>
      <td>${action('Eliminar', 'danger', `data-delete-inscripcion="${item.ID}"`)}</td>
    </tr>
  `).join('');

  $('#reportPreview').innerHTML = `
    <h3>Reporte de inscripciones</h3>
    <table>
      <thead><tr><th>Alumno</th><th>Materia</th><th>Estado</th><th>Nota</th><th>Fecha</th></tr></thead>
      <tbody>
        ${state.inscripciones.map((item) => `
          <tr><td>${item.ALUMNO}</td><td>${item.MATERIA}</td><td>${item.ESTADO}</td><td>${item.NOTA || '-'}</td><td>${item.FECHA}</td></tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function drawBarChart(canvas, rows, labelKey, valueKey, color) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey]) || 0));
  const barWidth = rows.length ? (width - 80) / rows.length : width - 80;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.font = '13px Arial';

  rows.forEach((row, index) => {
    const value = Number(row[valueKey]) || 0;
    const barHeight = ((height - 80) * value) / max;
    const x = 48 + index * barWidth;
    const y = height - 42 - barHeight;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(24, barWidth - 14), barHeight);
    ctx.fillStyle = '#172026';
    ctx.fillText(String(value), x + 4, y - 8);
    ctx.save();
    ctx.translate(x + 2, height - 20);
    ctx.rotate(-0.25);
    ctx.fillText(String(row[labelKey]).slice(0, 14), 0, 0);
    ctx.restore();
  });

  if (!rows.length) {
    ctx.fillStyle = '#65717a';
    ctx.fillText('Sin datos', 28, 34);
  }
}

function drawDonutChart(canvas, rows) {
  const ctx = canvas.getContext('2d');
  const total = rows.reduce((sum, row) => sum + Number(row.CANTIDAD || 0), 0);
  const colors = ['#087f8c', '#c75146', '#b38728', '#2f7d4f'];
  let start = -Math.PI / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '13px Arial';

  if (!total) {
    ctx.fillStyle = '#65717a';
    ctx.fillText('Sin datos', 28, 34);
    return;
  }

  rows.forEach((row, index) => {
    const slice = (Number(row.CANTIDAD) / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(128, 122);
    ctx.arc(128, 122, 88, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    start += slice;
  });

  ctx.beginPath();
  ctx.arc(128, 122, 42, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  rows.forEach((row, index) => {
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(250, 70 + index * 26, 14, 14);
    ctx.fillStyle = '#172026';
    ctx.fillText(`${row.ESTADO}: ${row.CANTIDAD}`, 272, 82 + index * 26);
  });
}

async function loadAll() {
  showMessage('');
  const [resumen, alumnos, materias, inscripciones] = await Promise.all([
    api('/api/resumen'),
    api('/api/alumnos'),
    api('/api/materias'),
    api('/api/inscripciones')
  ]);

  state.alumnos = alumnos;
  state.materias = materias;
  state.inscripciones = inscripciones;

  $('#metricAlumnos').textContent = resumen.totals.ALUMNOS || 0;
  $('#metricMaterias').textContent = resumen.totals.MATERIAS || 0;
  $('#metricInscripciones').textContent = resumen.totals.INSCRIPCIONES || 0;
  $('#metricPromedio').textContent = resumen.totals.PROMEDIO || 0;

  renderAlumnos();
  renderMaterias();
  renderInscripciones();
  drawBarChart($('#materiaChart'), resumen.byMateria, 'MATERIA', 'CANTIDAD', '#087f8c');
  drawDonutChart($('#estadoChart'), resumen.byEstado);
}

function bindNavigation() {
  $$('.nav-link').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.nav-link').forEach((item) => item.classList.remove('active'));
      $$('.view').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      $(`#${button.dataset.view}`).classList.add('active');
      $('#viewTitle').textContent = button.textContent;
    });
  });
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function bindForms() {
  $('#loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('', '#loginMessage');
    try {
      const result = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify(formData(event.currentTarget))
      });
      setAuthenticated(result.user, result.token);
      await loadAll();
      showMessage(`Bienvenido, ${result.user.nombre}`, '#appMessage', 'success');
    } catch (err) {
      showMessage(err.message, '#loginMessage');
    }
  });

  $('#alumnoForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = formData(event.currentTarget);
      const isEditing = Boolean(data.id);
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/alumnos/${data.id}` : '/api/alumnos';
      await api(url, { method, body: JSON.stringify(data) });
      event.currentTarget.reset();
      await loadAll();
      showMessage(isEditing ? 'Alumno actualizado correctamente.' : 'Alumno registrado correctamente.', '#appMessage', 'success');
    } catch (err) {
      showMessage(err.message);
    }
  });

  $('#materiaForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await api('/api/materias', { method: 'POST', body: JSON.stringify(formData(event.currentTarget)) });
      event.currentTarget.reset();
      await loadAll();
      showMessage('Materia registrada correctamente.', '#appMessage', 'success');
    } catch (err) {
      showMessage(err.message);
    }
  });

  $('#inscripcionForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await api('/api/inscripciones', { method: 'POST', body: JSON.stringify(formData(event.currentTarget)) });
      event.currentTarget.reset();
      await loadAll();
      showMessage('Inscripcion registrada correctamente.', '#appMessage', 'success');
    } catch (err) {
      showMessage(err.message);
    }
  });
}

function bindActions() {
  document.body.addEventListener('click', async (event) => {
    const target = event.target;

    if (target.matches('[data-edit-alumno]')) {
      const alumno = state.alumnos.find((item) => item.ID === Number(target.dataset.editAlumno));
      const form = $('#alumnoForm');
      form.elements.id.value = alumno.ID;
      form.elements.nombre.value = alumno.NOMBRE;
      form.elements.documento.value = alumno.DOCUMENTO;
      form.elements.email.value = alumno.EMAIL || '';
      form.elements.telefono.value = alumno.TELEFONO || '';
      showMessage('Editando alumno. Guarda los cambios para confirmar.', '#appMessage', 'success');
    }

    if (target.matches('[data-delete-alumno]')) {
      if (!confirmAction('Deseas eliminar este alumno? Tambien se eliminaran sus inscripciones.')) {
        return;
      }
      try {
        await api(`/api/alumnos/${target.dataset.deleteAlumno}`, { method: 'DELETE' });
        await loadAll();
        showMessage('Alumno eliminado correctamente.', '#appMessage', 'success');
      } catch (err) {
        showMessage(err.message);
      }
    }

    if (target.matches('[data-delete-materia]')) {
      if (!confirmAction('Deseas eliminar esta materia? Tambien se eliminaran sus inscripciones.')) {
        return;
      }
      try {
        await api(`/api/materias/${target.dataset.deleteMateria}`, { method: 'DELETE' });
        await loadAll();
        showMessage('Materia eliminada correctamente.', '#appMessage', 'success');
      } catch (err) {
        showMessage(err.message);
      }
    }

    if (target.matches('[data-delete-inscripcion]')) {
      if (!confirmAction('Deseas eliminar esta inscripcion?')) {
        return;
      }
      try {
        await api(`/api/inscripciones/${target.dataset.deleteInscripcion}`, { method: 'DELETE' });
        await loadAll();
        showMessage('Inscripcion eliminada correctamente.', '#appMessage', 'success');
      } catch (err) {
        showMessage(err.message);
      }
    }
  });

  $('#refreshBtn').addEventListener('click', () => loadAll()
    .then(() => showMessage('Datos actualizados.', '#appMessage', 'success'))
    .catch((err) => showMessage(err.message)));
  $('#logoutBtn').addEventListener('click', () => {
    logout();
    showMessage('Sesion cerrada correctamente.', '#loginMessage', 'success');
  });
  $('#printReport').addEventListener('click', () => window.print());
  $('#downloadCsv').addEventListener('click', () => {
    window.location.href = `/api/reportes/inscripciones.csv?token=${encodeURIComponent(state.token)}`;
  });

  $$('.table-filter').forEach((input) => {
    input.addEventListener('input', () => {
      const term = input.value.trim().toLowerCase();
      const rows = $$(`#${input.dataset.filterTarget} tr`);
      rows.forEach((row) => {
        row.hidden = term !== '' && !row.textContent.toLowerCase().includes(term);
      });
    });
  });
}

async function boot() {
  bindNavigation();
  bindForms();
  bindActions();

  if (state.token && state.user) {
    setAuthenticated(state.user, state.token);
    try {
      await loadAll();
    } catch (err) {
      logout();
      showMessage(err.message, '#loginMessage');
    }
  }
}

boot();
