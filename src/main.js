import './style.css';
import { playKick } from './audio/drumSynths.js';

document.querySelector('#app').innerHTML = `
  <main class="app">
    <h1>Núcleo</h1>
    <p class="subtitle">Fase 1 — un solo sonido</p>
    <button id="kick-btn" type="button">▶ Kick</button>
  </main>
`;

document.querySelector('#kick-btn').addEventListener('click', () => {
  playKick();
});
