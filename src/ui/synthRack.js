import { WAVEFORMS } from '../audio/synthEngine.js';

// Piano roll simplificado: filas = notas (agudo arriba, grave abajo), columnas
// = pasos del secuenciador. Un clic activa/desactiva una nota en ese paso.
export function renderSynthRack(container, track, state, handlers) {
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

  for (const noteName of track.notes) {
    const row = document.createElement('div');
    row.className = 'rack-row';

    const noteBtn = document.createElement('button');
    noteBtn.type = 'button';
    noteBtn.className = 'track-trigger note-label';
    noteBtn.textContent = noteName;
    noteBtn.addEventListener('click', () => handlers.onPreviewNote(track.id, noteName));
    row.appendChild(noteBtn);

    const cells = document.createElement('div');
    cells.className = 'step-cells';
    for (let i = 0; i < state.stepCount; i++) {
      const key = `${noteName}_${i}`;
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'step-cell';
      cell.dataset.step = String(i);
      if (i % 4 === 0) cell.classList.add('beat-start');
      if (track.grid[key]) cell.classList.add('active');
      cell.addEventListener('click', () => {
        track.grid[key] = !track.grid[key];
        cell.classList.toggle('active', track.grid[key]);
      });
      cells.appendChild(cell);
    }
    row.appendChild(cells);
    wrapper.appendChild(row);
  }

  container.appendChild(wrapper);

  return {
    setPlayhead(stepIndex) {
      container.querySelectorAll('.step-cell.playhead').forEach((el) => el.classList.remove('playhead'));
      container.querySelectorAll(`.step-cell[data-step="${stepIndex}"]`).forEach((el) => el.classList.add('playhead'));
    },
  };
}
