document.addEventListener('DOMContentLoaded', () => {

  const contenedorIngresos = document.getElementById('contenedor-ingresos-adicionales');
  const contenedorGastos = document.getElementById('contenedor-gastos-fijos');
  const btnAddIngreso = document.getElementById('btn-add-ingreso');
  const btnAddGasto = document.getElementById('btn-add-gasto');
  const formCaracterizacion = document.getElementById('form-caracterizacion');

  // 1. Agregar Ingreso Adicional
  btnAddIngreso.addEventListener('click', () => {
    const filaHTML = `
      <div class="row g-2 align-items-center fila-ingreso-adicional mb-2">
        <div class="col-6">
          <input type="text" class="form-control" placeholder="Concepto" name="ingreso_nombre" required>
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

  // 2. Agregar Gasto Fijo
  btnAddGasto.addEventListener('click', () => {
    const idUnico = 'switch_' + Date.now();
    const filaHTML = `
      <div class="p-3 border rounded bg-light fila-gasto-fijo mb-2">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-5">
            <input type="text" class="form-control" placeholder="Nombre" name="gasto_nombre" required>
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

  // 3. Delegación de eventos para Switches y Eliminar
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

 // 4. Guardar Configuración, Calcular Saldo Base y Almacenar en LocalStorage
formCaracterizacion.addEventListener('submit', (e) => {
  e.preventDefault();

  // 1. Obtener ingreso principal
  const ingresoPrincipal = parseFloat(document.getElementById('ingreso-principal').value) || 0;

  // 2. Recorrer e estructurar ingresos adicionales
  const ingresosAdicionales = Array.from(document.querySelectorAll('.fila-ingreso-adicional')).map(fila => {
    return {
      nombre: fila.querySelector('[name="ingreso_nombre"]').value,
      monto: parseFloat(fila.querySelector('[name="ingreso_monto"]').value) || 0
    };
  });

  // 3. Recorrer e estructurar gastos fijos calculando 'valorReal'
  const gastosFijos = Array.from(document.querySelectorAll('.fila-gasto-fijo')).map(fila => {
    const nombre = fila.querySelector('[name="gasto_nombre"]').value;
    const monto = parseFloat(fila.querySelector('[name="gasto_monto"]').value) || 0;
    const esCompartido = fila.querySelector('.check-compartido').checked;

    let valorReal = monto;
    let tipoDivision = 'ninguna'; // 'porcentaje' | 'personas' | 'ninguna'
    let porcentaje = null;
    let numPersonas = null;

    if (esCompartido) {
      // Si usas un selector o si es por personas/porcentaje:
      const inputPersonas = fila.querySelector('[name="gasto_personas"]');
      const inputPorcentaje = fila.querySelector('[name="gasto_porcentaje"]');

      if (inputPorcentaje && inputPorcentaje.value !== "") {
        tipoDivision = 'porcentaje';
        porcentaje = parseFloat(inputPorcentaje.value) || 0;
        valorReal = monto * (porcentaje / 100);
      } else if (inputPersonas && inputPersonas.value !== "") {
        tipoDivision = 'personas';
        numPersonas = parseInt(inputPersonas.value) || 1;
        valorReal = monto / numPersonas;
      }
    }

    return {
      nombre,
      monto,
      esCompartido,
      tipoDivision,
      porcentaje,
      numPersonas,
      valorReal
    };
  });

  // 4. Totales y Saldo Base
  const totalIngresosAdicionales = ingresosAdicionales.reduce((acc, item) => acc + item.monto, 0);
  const totalIngresos = ingresoPrincipal + totalIngresosAdicionales;
  const totalGastosFijos = gastosFijos.reduce((acc, item) => acc + item.valorReal, 0);
  const saldoBase = totalIngresos - totalGastosFijos;

  // 5. Objeto JS Limpio Final
  const config = {
    ingresoPrincipal,
    ingresosAdicionales,
    gastosFijos,
    totalIngresos,
    totalGastosFijos,
    saldoBase
  };

  // 6. Guardar en localStorage
  localStorage.setItem('config', JSON.stringify(config));

  console.log('Configuración guardada en LocalStorage:', config);

  // 7. Ocultar Wizard y Mostrar Dashboard
  document.getElementById('wizard').classList.add('d-none');
  document.getElementById('dashboard').classList.remove('d-none');
});