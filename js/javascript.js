document.addEventListener('DOMContentLoaded', () => {

  const wizardSection = document.getElementById('wizard');
  const dashboardSection = document.getElementById('dashboard');

  const contenedorIngresos = document.getElementById('contenedor-ingresos-adicionales');
  const contenedorGastos = document.getElementById('contenedor-gastos-fijos');
  const btnAddIngreso = document.getElementById('btn-add-ingreso');
  const btnAddGasto = document.getElementById('btn-add-gasto');
  const formCaracterizacion = document.getElementById('form-caracterizacion');

  const formGastos = document.getElementById('form-gastos');
  const tablaGastosBody = document.getElementById('lista-gastos');

  const formIngresosExtra = document.getElementById('form-ingresos-extra');
  const tablaIngresosExtraBody = document.getElementById('lista-ingresos-extra');

  const formGastosFijosDash = document.getElementById('form-gastos-fijos-dashboard');
  const tablaGastosFijosBody = document.getElementById('lista-gastos-fijos');

  const formatoMoneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  // =========================================================================
  // 1. CONTROL DE FLUJO Y ARRANQUE
  // =========================================================================
  function iniciarApp() {
    const configGuardada = localStorage.getItem('config');

    if (configGuardada) {
      try {
        const config = JSON.parse(configGuardada);

        wizardSection.classList.add('d-none');
        dashboardSection.classList.remove('d-none');

        actualizarDashboard(config);
        renderTablaGastosDiarios();
        renderTablaIngresosExtra();
        renderTablaGastosFijos();

      } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarWizard();
      }
    } else {
      mostrarWizard();
    }
  }

  function mostrarWizard() {
    wizardSection.classList.remove('d-none');
    dashboardSection.classList.add('d-none');
  }

  // =========================================================================
  // 2. ACTUALIZAR DASHBOARD Y CARDS
  // =========================================================================
  function actualizarDashboard(config) {
    if (!config) {
      const configGuardada = localStorage.getItem('config');
      if (!configGuardada) return;
      config = JSON.parse(configGuardada);
    }

    const gastosDiarios = JSON.parse(localStorage.getItem('gastosDiarios')) || [];
    const ingresosExtraDash = JSON.parse(localStorage.getItem('ingresosExtra')) || [];

    const totalIngresosExtraDash = ingresosExtraDash.reduce((sum, item) => sum + item.monto, 0);
    const ingresosTotales = (config.totalIngresos || 0) + totalIngresosExtraDash;

    const gastosFijosTotales = config.totalGastosFijos || 0;
    const totalGastosVariables = gastosDiarios.reduce((sum, item) => sum + item.monto, 0);

    const capacidadDisponible = ingresosTotales - gastosFijosTotales - totalGastosVariables;

    const elIngresos = document.getElementById('card-ingresos-totales');
    const elGastosFijos = document.getElementById('card-gastos-fijos');
    const elSaldo = document.getElementById('card-saldo-inicial');
    const elVariables = document.getElementById('card-gastos-variables');

    if (elIngresos) elIngresos.textContent = formatoMoneda.format(ingresosTotales);
    if (elGastosFijos) elGastosFijos.textContent = formatoMoneda.format(gastosFijosTotales);
    if (elSaldo) elSaldo.textContent = formatoMoneda.format(capacidadDisponible);
    if (elVariables) elVariables.textContent = formatoMoneda.format(totalGastosVariables);
  }

  // =========================================================================
  // 3. MÓDULO GASTOS DIARIOS
  // =========================================================================
  if (formGastos) {
    formGastos.addEventListener('submit', (e) => {
      e.preventDefault();

      const concepto = document.getElementById('gasto-concepto').value.trim();
      const monto = parseFloat(document.getElementById('gasto-monto').value) || 0;
      const categoria = document.getElementById('gasto-categoria').value;
      const fecha = new Date().toLocaleDateString('es-CO');

      if (!concepto || monto <= 0 || !categoria) return;

      const nuevoGasto = { id: Date.now(), concepto, monto, categoria, fecha };

      const gastosDiarios = JSON.parse(localStorage.getItem('gastosDiarios')) || [];
      gastosDiarios.push(nuevoGasto);
      localStorage.setItem('gastosDiarios', JSON.stringify(gastosDiarios));

      formGastos.reset();
      renderTablaGastosDiarios();
      actualizarDashboard();
    });
  }

  function renderTablaGastosDiarios() {
    if (!tablaGastosBody) return;

    const gastosDiarios = JSON.parse(localStorage.getItem('gastosDiarios')) || [];
    tablaGastosBody.innerHTML = '';

    if (gastosDiarios.length === 0) {
      tablaGastosBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No hay gastos registrados.</td></tr>`;
      return;
    }

    gastosDiarios.forEach((gasto, index) => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${gasto.fecha}</td>
        <td>${gasto.concepto}</td>
        <td><span class="badge bg-secondary">${gasto.categoria}</span></td>
        <td class="fw-bold">${formatoMoneda.format(gasto.monto)}</td>
        <td class="text-end">
          <button class="btn btn-outline-danger btn-sm btn-eliminar-gasto" data-index="${index}">Eliminar</button>
        </td>
      `;
      tablaGastosBody.appendChild(fila);
    });
  }

  if (tablaGastosBody) {
    tablaGastosBody.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-eliminar-gasto')) {
        const index = e.target.getAttribute('data-index');
        let gastosDiarios = JSON.parse(localStorage.getItem('gastosDiarios')) || [];
        gastosDiarios.splice(index, 1);
        localStorage.setItem('gastosDiarios', JSON.stringify(gastosDiarios));

        renderTablaGastosDiarios();
        actualizarDashboard();
      }
    });
  }

  // =========================================================================
  // 4. MÓDULO INGRESOS EXTRA / ADICIONALES (ACTUALIZADO)
  // =========================================================================
  if (formIngresosExtra) {
    formIngresosExtra.addEventListener('submit', (e) => {
      e.preventDefault();

      const concepto = document.getElementById('ingreso-extra-concepto').value.trim();
      const monto = parseFloat(document.getElementById('ingreso-extra-monto').value) || 0;
      const fecha = new Date().toLocaleDateString('es-CO');

      if (!concepto || monto <= 0) return;

      const nuevoIngreso = { id: Date.now(), concepto, monto, fecha };

      const ingresosExtra = JSON.parse(localStorage.getItem('ingresosExtra')) || [];
      ingresosExtra.push(nuevoIngreso);
      localStorage.setItem('ingresosExtra', JSON.stringify(ingresosExtra));

      formIngresosExtra.reset();
      renderTablaIngresosExtra();
      actualizarDashboard();
    });
  }

  function renderTablaIngresosExtra() {
    if (!tablaIngresosExtraBody) return;

    const config = JSON.parse(localStorage.getItem('config')) || {};
    const ingresosWizard = config.ingresosAdicionales || [];
    const ingresosDashboard = JSON.parse(localStorage.getItem('ingresosExtra')) || [];
    const fechaHoy = new Date().toLocaleDateString('es-CO');

    const todosLosIngresos = [
      ...ingresosWizard.map(i => ({ 
        fecha: i.fecha || fechaHoy, 
        concepto: i.nombre, 
        monto: i.monto, 
        esWizard: true 
      })),
      ...ingresosDashboard.map((i, idx) => ({ 
        fecha: i.fecha, 
        concepto: i.concepto, 
        monto: i.monto, 
        indexDash: idx 
      }))
    ];

    tablaIngresosExtraBody.innerHTML = '';

    if (todosLosIngresos.length === 0) {
      tablaIngresosExtraBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No hay ingresos adicionales registrados.</td></tr>`;
      return;
    }

    todosLosIngresos.forEach((ingreso) => {
      const fila = document.createElement('tr');
      const botonAccion = ingreso.esWizard 
        ? `<span class="badge bg-light text-dark border">Configuración</span>`
        : `<button class="btn btn-outline-danger btn-sm btn-eliminar-ingreso-extra" data-index="${ingreso.indexDash}">Eliminar</button>`;

      fila.innerHTML = `
        <td>${ingreso.fecha}</td>
        <td>${ingreso.concepto}</td>
        <td class="fw-bold text-success">${formatoMoneda.format(ingreso.monto)}</td>
        <td class="text-end">${botonAccion}</td>
      `;
      tablaIngresosExtraBody.appendChild(fila);
    });
  }

  if (tablaIngresosExtraBody) {
    tablaIngresosExtraBody.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-eliminar-ingreso-extra')) {
        const index = e.target.getAttribute('data-index');
        let ingresosExtra = JSON.parse(localStorage.getItem('ingresosExtra')) || [];
        ingresosExtra.splice(index, 1);
        localStorage.setItem('ingresosExtra', JSON.stringify(ingresosExtra));

        renderTablaIngresosExtra();
        actualizarDashboard();
      }
    });
  }

  // =========================================================================
  // 5. MÓDULO GASTOS FIJOS (PESTAÑA DASHBOARD)
  // =========================================================================
  if (formGastosFijosDash) {
    formGastosFijosDash.addEventListener('submit', (e) => {
      e.preventDefault();

      const nombre = document.getElementById('gasto-fijo-concepto').value.trim();
      const monto = parseFloat(document.getElementById('gasto-fijo-monto').value) || 0;
      const numPersonas = parseInt(document.getElementById('gasto-fijo-personas').value) || 1;

      if (!nombre || monto <= 0) return;

      const valorReal = monto / numPersonas;
      const nuevoGastoFijo = {
        nombre,
        monto,
        esCompartido: numPersonas > 1,
        numPersonas,
        valorReal
      };

      const config = JSON.parse(localStorage.getItem('config')) || {};
      config.gastosFijos = config.gastosFijos || [];
      config.gastosFijos.push(nuevoGastoFijo);

      config.totalGastosFijos = config.gastosFijos.reduce((sum, g) => sum + g.valorReal, 0);
      config.saldoBase = config.totalIngresos - config.totalGastosFijos;

      localStorage.setItem('config', JSON.stringify(config));

      formGastosFijosDash.reset();
      document.getElementById('gasto-fijo-personas').value = '1';

      renderTablaGastosFijos();
      actualizarDashboard(config);
    });
  }

  function renderTablaGastosFijos() {
    if (!tablaGastosFijosBody) return;

    const config = JSON.parse(localStorage.getItem('config')) || {};
    const gastosFijos = config.gastosFijos || [];

    tablaGastosFijosBody.innerHTML = '';

    if (gastosFijos.length === 0) {
      tablaGastosFijosBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No hay gastos fijos registrados.</td></tr>`;
      return;
    }

    gastosFijos.forEach((gasto, index) => {
      const fila = document.createElement('tr');
      const textoCompartido = gasto.esCompartido ? `Sí (${gasto.numPersonas} pers.)` : 'No';

      fila.innerHTML = `
        <td>${gasto.nombre}</td>
        <td>${formatoMoneda.format(gasto.monto)}</td>
        <td><span class="badge bg-secondary">${textoCompartido}</span></td>
        <td class="fw-bold text-danger">${formatoMoneda.format(gasto.valorReal)}</td>
        <td class="text-end">
          <button class="btn btn-outline-danger btn-sm btn-eliminar-gasto-fijo" data-index="${index}">Eliminar</button>
        </td>
      `;
      tablaGastosFijosBody.appendChild(fila);
    });
  }

  if (tablaGastosFijosBody) {
    tablaGastosFijosBody.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-eliminar-gasto-fijo')) {
        const index = e.target.getAttribute('data-index');
        const config = JSON.parse(localStorage.getItem('config')) || {};

        config.gastosFijos.splice(index, 1);
        config.totalGastosFijos = config.gastosFijos.reduce((sum, g) => sum + g.valorReal, 0);
        config.saldoBase = config.totalIngresos - config.totalGastosFijos;

        localStorage.setItem('config', JSON.stringify(config));

        renderTablaGastosFijos();
        actualizarDashboard(config);
      }
    });
  }

  // =========================================================================
  // 6. GENERACIÓN DINÁMICA WIZARD
  // =========================================================================
  if (btnAddIngreso) {
    btnAddIngreso.addEventListener('click', () => {
      const filaHTML = `
        <div class="row g-2 align-items-center fila-ingreso-adicional mb-2">
          <div class="col-6">
            <input type="text" class="form-control" placeholder="Concepto (ej. Freelance)" name="ingreso_nombre" required>
          </div>
          <div class="col-5">
            <input type="number" step="0.01" class="form-control" placeholder="Monto" name="ingreso_monto" required>
          </div>
          <div class="col-1 text-end">
            <button type="button" class="btn btn-outline-secondary btn-sm btn-eliminar">&times;</button>
          </div>
        </div>
      `;
      contenedorIngresos.insertAdjacentHTML('beforeend', filaHTML);
    });
  }

  if (btnAddGasto) {
    btnAddGasto.addEventListener('click', () => {
      const idUnico = 'switch_' + Date.now();
      const filaHTML = `
        <div class="p-3 border rounded bg-light fila-gasto-fijo mb-2">
          <div class="row g-2 align-items-center">
            <div class="col-12 col-md-5">
              <input type="text" class="form-control" placeholder="Nombre (ej. Arriendo)" name="gasto_nombre" required>
            </div>
            <div class="col-8 col-md-4">
              <input type="number" step="0.01" class="form-control" placeholder="Monto" name="gasto_monto" required>
            </div>
            <div class="col-4 col-md-3 text-end">
              <button type="button" class="btn btn-outline-danger btn-sm w-100 btn-eliminar">Eliminar</button>
            </div>
          </div>

          <div class="row g-2 mt-2 align-items-center">
            <div class="col-6 col-md-4">
              <div class="form-check form-switch">
                <input class="form-check-input check-compartido" type="checkbox" role="switch" id="${idUnico}">
                <label class="form-check-label small" for="${idUnico}">Es compartido</label>
              </div>
            </div>
            <div class="col-6 col-md-8 campo-personas d-none">
              <div class="input-group input-group-sm">
                <span class="input-group-text">N° Personas</span>
                <input type="number" class="form-control" name="gasto_personas" min="2" value="2">
              </div>
            </div>
          </div>
        </div>
      `;
      contenedorGastos.insertAdjacentHTML('beforeend', filaHTML);
    });
  }

  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('check-compartido')) {
      const fila = e.target.closest('.fila-gasto-fijo');
      const campoPersonas = fila.querySelector('.campo-personas');
      campoPersonas.classList.toggle('d-none', !e.target.checked);
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-eliminar')) {
      const fila = e.target.closest('.fila-ingreso-adicional, .fila-gasto-fijo');
      if (fila) fila.remove();
    }
  });

  // =========================================================================
  // 7. GUARDAR CONFIGURACIÓN WIZARD (ACTUALIZADO)
  // =========================================================================
  if (formCaracterizacion) {
    formCaracterizacion.addEventListener('submit', (e) => {
      e.preventDefault();

      const fechaActual = new Date().toLocaleDateString('es-CO');
      const ingresoPrincipal = parseFloat(document.getElementById('ingreso-principal').value) || 0;

      const ingresosAdicionales = Array.from(document.querySelectorAll('.fila-ingreso-adicional')).map(fila => ({
        nombre: fila.querySelector('[name="ingreso_nombre"]').value,
        monto: parseFloat(fila.querySelector('[name="ingreso_monto"]').value) || 0,
        fecha: fechaActual
      }));

      const gastosFijos = Array.from(document.querySelectorAll('.fila-gasto-fijo')).map(fila => {
        const nombre = fila.querySelector('[name="gasto_nombre"]').value;
        const monto = parseFloat(fila.querySelector('[name="gasto_monto"]').value) || 0;
        const esCompartido = fila.querySelector('.check-compartido').checked;

        let valorReal = monto;
        let numPersonas = 1;

        if (esCompartido) {
          const inputPersonas = fila.querySelector('[name="gasto_personas"]');
          numPersonas = parseInt(inputPersonas ? inputPersonas.value : 1) || 1;
          valorReal = monto / numPersonas;
        }

        return { nombre, monto, esCompartido, numPersonas, valorReal };
      });

      const totalIngresos = ingresoPrincipal + ingresosAdicionales.reduce((acc, i) => acc + i.monto, 0);
      const totalGastosFijos = gastosFijos.reduce((acc, g) => acc + g.valorReal, 0);
      const saldoBase = totalIngresos - totalGastosFijos;

      const config = {
        ingresoPrincipal,
        ingresosAdicionales,
        gastosFijos,
        totalIngresos,
        totalGastosFijos,
        saldoBase
      };

      localStorage.setItem('config', JSON.stringify(config));
      iniciarApp();
    });
  }

  // =========================================================================
  // 8. BOTÓN REINICIAR
  // =========================================================================
  const btnReiniciar = document.getElementById('btn-reiniciar');
  if (btnReiniciar) {
    btnReiniciar.addEventListener('click', () => {
      if (confirm("¿Estás seguro de que deseas borrar todos los datos y reiniciar la configuración?")) {
        localStorage.clear();

        if (formCaracterizacion) formCaracterizacion.reset();
        if (contenedorIngresos) contenedorIngresos.innerHTML = '';
        if (contenedorGastos) contenedorGastos.innerHTML = '';
        if (formGastos) formGastos.reset();
        if (formIngresosExtra) formIngresosExtra.reset();
        if (formGastosFijosDash) formGastosFijosDash.reset();

        mostrarWizard();
      }
    });
  }

  iniciarApp();

});