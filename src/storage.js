// Guardado con localStorage del navegador (spec 5.7): no hay backend ni
// base de datos, así que el proyecto queda guardado únicamente en este
// navegador y esta computadora.
const PREFIX = 'nucleo:';

export function saveProject(name, state) {
  localStorage.setItem(PREFIX + name, JSON.stringify(state));
}

export function loadProject(name) {
  const raw = localStorage.getItem(PREFIX + name);
  return raw ? JSON.parse(raw) : null;
}

export function listProjects() {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith(PREFIX))
    .map((key) => key.slice(PREFIX.length));
}

export function deleteProject(name) {
  localStorage.removeItem(PREFIX + name);
}
