// Cuadrícula de step sequencer para las 6 pistas de batería, más un botón
// de disparo manual por pista para probar cada sonido individualmente
// (spec Fase 2) antes/además de programarlo en el patrón (Fase 3-4).
export function renderDrumRack(container, state, handlers) {
  container.innerHTML = '';

  const rack = document.createElement('div');
  rack.className = 'rack drum-rack';

  for (const track of state.drumTracks) {
    const row = document.createElement('div');
    row.className = 'rack-row';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'track-trigger';
    trigger.textContent = track.label;
    trigger.addEventListener('click', () => handlers.onTrigger(track.id));
    row.appendChild(trigger);

    const cells = document.createElement('div');
    cells.className = 'step-cells';
    for (let i = 0; i < state.stepCount; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'step-cell';
      cell.dataset.step = String(i);
      if (i % 4 === 0) cell.classList.add('beat-start');
      if (track.pattern[i]) cell.classList.add('active');
      cell.addEventListener('click', () => {
        track.pattern[i] = !track.pattern[i];
        cell.classList.toggle('active', track.pattern[i]);
      });
      cells.appendChild(cell);
    }
    row.appendChild(cells);
    rack.appendChild(row);
  }

  container.appendChild(rack);

  return {
    setPlayhead(stepIndex) {
      container.querySelectorAll('.step-cell.playhead').forEach((el) => el.classList.remove('playhead'));
      container.querySelectorAll(`.step-cell[data-step="${stepIndex}"]`).forEach((el) => el.classList.add('playhead'));
    },
  };
}
