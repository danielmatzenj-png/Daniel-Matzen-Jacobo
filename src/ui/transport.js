export function renderTransport(container, state, handlers) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'transport';

  const playBtn = document.createElement('button');
  playBtn.className = 'play-btn';
  playBtn.type = 'button';
  playBtn.textContent = '▶ Play';
  playBtn.addEventListener('click', () => handlers.onTogglePlay());
  wrapper.appendChild(playBtn);

  const bpmLabel = document.createElement('label');
  bpmLabel.className = 'bpm-label';
  bpmLabel.textContent = 'BPM';
  const bpmInput = document.createElement('input');
  bpmInput.type = 'number';
  bpmInput.min = '40';
  bpmInput.max = '220';
  bpmInput.value = String(state.bpm);
  bpmInput.addEventListener('change', () => {
    const value = Math.min(220, Math.max(40, Number(bpmInput.value) || state.bpm));
    state.bpm = value;
    bpmInput.value = String(value);
  });
  bpmLabel.appendChild(bpmInput);
  wrapper.appendChild(bpmLabel);

  container.appendChild(wrapper);

  return {
    setPlaying(isPlaying) {
      playBtn.textContent = isPlaying ? '■ Stop' : '▶ Play';
      playBtn.classList.toggle('playing', isPlaying);
    },
    setBpm(bpm) {
      bpmInput.value = String(bpm);
    },
  };
}

// Atajo de teclado (Fase 10): barra espaciadora = play/stop, salvo que el
// foco esté en un campo de texto/número/select.
export function setupKeyboardShortcuts({ onTogglePlay }) {
  document.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    event.preventDefault();
    onTogglePlay();
  });
}
