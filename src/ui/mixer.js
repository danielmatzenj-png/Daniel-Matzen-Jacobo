import { allTracks } from '../state.js';

function sliderRow(labelText, { min, max, value, onInput }) {
  const label = document.createElement('label');
  label.className = 'mixer-slider';
  label.textContent = labelText;
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  input.addEventListener('input', () => onInput(Number(input.value)));
  label.appendChild(input);
  return label;
}

function renderChannelStrip(track, { onVolPanChange, onSoloMuteChange }) {
  const strip = document.createElement('div');
  strip.className = 'mixer-channel';

  const title = document.createElement('div');
  title.className = 'mixer-title';
  title.textContent = track.label;
  strip.appendChild(title);

  strip.appendChild(
    sliderRow('Vol', {
      min: 0,
      max: 100,
      value: Math.round(track.vol * 100),
      onInput: (value) => {
        track.vol = value / 100;
        onVolPanChange(track.id);
      },
    })
  );

  strip.appendChild(
    sliderRow('Pan', {
      min: -100,
      max: 100,
      value: Math.round(track.pan * 100),
      onInput: (value) => {
        track.pan = value / 100;
        onVolPanChange(track.id);
      },
    })
  );

  const buttonsRow = document.createElement('div');
  buttonsRow.className = 'mixer-buttons';

  const muteBtn = document.createElement('button');
  muteBtn.type = 'button';
  muteBtn.className = 'mute-btn' + (track.mute ? ' active' : '');
  muteBtn.textContent = 'M';
  muteBtn.addEventListener('click', () => {
    track.mute = !track.mute;
    muteBtn.classList.toggle('active', track.mute);
    onSoloMuteChange();
  });
  buttonsRow.appendChild(muteBtn);

  const soloBtn = document.createElement('button');
  soloBtn.type = 'button';
  soloBtn.className = 'solo-btn' + (track.solo ? ' active' : '');
  soloBtn.textContent = 'S';
  soloBtn.addEventListener('click', () => {
    track.solo = !track.solo;
    soloBtn.classList.toggle('active', track.solo);
    onSoloMuteChange();
  });
  buttonsRow.appendChild(soloBtn);

  strip.appendChild(buttonsRow);
  return strip;
}

// Mezclador: por pista, fader de volumen, pan, mute y solo (spec 5.5). Lógica
// de solo: si CUALQUIER pista tiene solo activado, todas las que NO tengan
// solo se silencian automáticamente, sin importar su propio mute
// (implementada en audio/context.js::isTrackAudible, disparada por
// onSoloMuteChange). También incluye los controles del master (spec 5.6):
// volumen, mezcla de reverb/delay y filtro de brillo.
export function renderMixer(container, state, handlers) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'mixer';

  for (const track of allTracks(state)) {
    wrapper.appendChild(renderChannelStrip(track, handlers));
  }

  const masterStrip = document.createElement('div');
  masterStrip.className = 'mixer-channel master-channel';
  const masterTitle = document.createElement('div');
  masterTitle.className = 'mixer-title';
  masterTitle.textContent = 'Master';
  masterStrip.appendChild(masterTitle);

  masterStrip.appendChild(
    sliderRow('Volumen', {
      min: 0,
      max: 100,
      value: Math.round(state.master.volume * 100),
      onInput: (value) => {
        state.master.volume = value / 100;
        handlers.onMasterChange();
      },
    })
  );
  masterStrip.appendChild(
    sliderRow('Reverb', {
      min: 0,
      max: 100,
      value: Math.round(state.master.reverbMix * 100),
      onInput: (value) => {
        state.master.reverbMix = value / 100;
        handlers.onMasterChange();
      },
    })
  );
  masterStrip.appendChild(
    sliderRow('Delay', {
      min: 0,
      max: 100,
      value: Math.round(state.master.delayMix * 100),
      onInput: (value) => {
        state.master.delayMix = value / 100;
        handlers.onMasterChange();
      },
    })
  );
  masterStrip.appendChild(
    sliderRow('Filtro', {
      min: 0,
      max: 100,
      value: Math.round(state.master.filterCutoff * 100),
      onInput: (value) => {
        state.master.filterCutoff = value / 100;
        handlers.onMasterChange();
      },
    })
  );

  wrapper.appendChild(masterStrip);
  container.appendChild(wrapper);
}
