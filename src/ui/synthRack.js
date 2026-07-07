import { WAVEFORMS } from '../audio/synthEngine.js';

// Piano roll simplificado y genérico: filas = `rows` (notas o, en el caso de
// la pista de Acordes, tríadas diatónicas), columnas = pasos del
// secuenciador. Un clic activa/desactiva una celda en `track.grid`, con la
// clave `${row.key}_${step}`.
//
// `handlers.singleActivePerColumn` (usado por la pista de Acordes): al
// activar una celda, se desactivan las demás filas de esa misma columna —
// solo puede sonar un acorde por paso.
export function renderSynthRack(container, track, rows, state, handlers) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'rack synth-rack';

  const header = document.createElement('div');
  header.className = 'synth-header';

  const title = document.createElement('h3');
  title.textContent = track.label;
  header.appendChild(title);

  const waveLabel = document.createElement('label');
  waveLabel.textContent = 'Forma de onda';
  const waveSelect = document.createElement('select');
  for (const waveform of WAVEFORMS) {
    const option = document.createElement('option');
    option.value = waveform;
    option.textContent = waveform;
    if (waveform === track.waveform) option.selected = true;
    waveSelect.appendChild(option);
  }
  waveSelect.addEventListener('change', () => {
    track.waveform = waveSelect.value;
  });
  waveLabel.appendChild(waveSelect);
  header.appendChild(waveLabel);

  wrapper.appendChild(header);

  // cellMatrix[rowIndex][step] = { cell, gridKey } — se usa para poder
  // limpiar de golpe las demás filas de una columna cuando
  // singleActivePerColumn está activo, sin tener que re-renderizar todo.
  const cellMatrix = [];

  rows.forEach((row, rowIndex) => {
    const rackRow = document.createElement('div');
    rackRow.className = 'rack-row';

    const rowBtn = document.createElement('button');
    rowBtn.type = 'button';
    rowBtn.className = 'track-trigger row-label';
    rowBtn.textContent = row.label;
    rowBtn.addEventListener('click', () => handlers.onPreviewRow(row.key));
    rackRow.appendChild(rowBtn);

    const cells = document.createElement('div');
    cells.className = 'step-cells';
    const rowCells = [];

    for (let i = 0; i < state.stepCount; i++) {
      const gridKey = `${row.key}_${i}`;
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'step-cell';
      cell.dataset.step = String(i);
      if (i % 4 === 0) cell.classList.add('beat-start');
      if (track.grid[gridKey]) cell.classList.add('active');

      cell.addEventListener('click', () => {
        const turningOn = !track.grid[gridKey];

        if (turningOn && handlers.singleActivePerColumn) {
          for (let r = 0; r < cellMatrix.length; r++) {
            if (r === rowIndex) continue;
            const other = cellMatrix[r][i];
            track.grid[other.gridKey] = false;
            other.cell.classList.remove('active');
          }
        }

        track.grid[gridKey] = turningOn;
        cell.classList.toggle('active', turningOn);
      });

      rowCells.push({ cell, gridKey });
      cells.appendChild(cell);
    }

    cellMatrix.push(rowCells);
    rackRow.appendChild(cells);
    wrapper.appendChild(rackRow);
  });

  container.appendChild(wrapper);

  return {
    setPlayhead(stepIndex) {
      container.querySelectorAll('.step-cell.playhead').forEach((el) => el.classList.remove('playhead'));
      container.querySelectorAll(`.step-cell[data-step="${stepIndex}"]`).forEach((el) => el.classList.add('playhead'));
    },
  };
}
