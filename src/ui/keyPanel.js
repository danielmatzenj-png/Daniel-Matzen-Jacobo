import { CHROMATIC, SCALES } from '../audio/theory.js';

// Selector de tonalidad: nota raíz + tipo de escala, más el interruptor de
// "bloqueo de escala". Con el bloqueo activo, el piano roll de melodía/bajo
// solo deja tocar notas de esta escala y la pista de Acordes usa sus 7
// tríadas diatónicas — así cualquier combinación que armes encaja.
export function renderKeyPanel(container, state, handlers) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'key-panel';

  const rootLabel = document.createElement('label');
  rootLabel.textContent = 'Tónica';
  const rootSelect = document.createElement('select');
  for (const note of CHROMATIC) {
    const option = document.createElement('option');
    option.value = note;
    option.textContent = note;
    if (note === state.key.root) option.selected = true;
    rootSelect.appendChild(option);
  }
  rootSelect.addEventListener('change', () => {
    state.key.root = rootSelect.value;
    handlers.onKeyChange();
  });
  rootLabel.appendChild(rootSelect);
  wrapper.appendChild(rootLabel);

  const scaleLabel = document.createElement('label');
  scaleLabel.textContent = 'Escala';
  const scaleSelect = document.createElement('select');
  for (const [key, def] of Object.entries(SCALES)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = def.label;
    if (key === state.key.scale) option.selected = true;
    scaleSelect.appendChild(option);
  }
  scaleSelect.addEventListener('change', () => {
    state.key.scale = scaleSelect.value;
    handlers.onKeyChange();
  });
  scaleLabel.appendChild(scaleSelect);
  wrapper.appendChild(scaleLabel);

  const lockLabel = document.createElement('label');
  lockLabel.className = 'scale-lock-label';
  const lockCheckbox = document.createElement('input');
  lockCheckbox.type = 'checkbox';
  lockCheckbox.checked = state.scaleLock;
  lockCheckbox.addEventListener('change', () => {
    state.scaleLock = lockCheckbox.checked;
    handlers.onKeyChange();
  });
  lockLabel.appendChild(lockCheckbox);
  lockLabel.appendChild(document.createTextNode(' Bloquear a la escala'));
  wrapper.appendChild(lockLabel);

  const hint = document.createElement('p');
  hint.className = 'key-hint';
  hint.textContent =
    'Con el bloqueo activo, la melodía y el bajo solo muestran notas de esta tonalidad, y los Acordes usan sus 7 tríadas diatónicas: todo lo que programes va a encajar.';
  wrapper.appendChild(hint);

  container.appendChild(wrapper);
}
