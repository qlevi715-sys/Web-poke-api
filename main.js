const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

const POKEAPI = 'https://pokeapi.co/api/v2';
const TOTAL_POKEMON = 493
const CONCURRENCY = 15;

let cache = null;

async function fetchJson(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}

function simplify(p) {
  const stats = Object.fromEntries((p.stats || []).map((s) => [s.stat.name, s.base_stat]));
  return {
    id: p.id,
    name: p.name,
    height: p.height / 10,
    weight: p.weight / 10,
    types: (p.types || []).map((t) => t.type.name),
    abilities: (p.abilities || []).map((a) => ({ name: a.ability.name, hidden: a.is_hidden })),
    image:
      (p.sprites && p.sprites.other && p.sprites.other['official-artwork'] &&
        p.sprites.other['official-artwork'].front_default) ||
      (p.sprites && p.sprites.front_default) ||
      null,
    hp: stats.hp,
    attack: stats.attack,
    defense: stats.defense
  };
}

async function loadAllPokemon() {
  const results = new Array(TOTAL_POKEMON);
  let next = 0;

  async function worker() {
    while (next < TOTAL_POKEMON) {
      const index = next++;
      const data = await fetchJson(`${POKEAPI}/pokemon/${index + 1}`);
      results[index] = simplify(data);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results;
}

ipcMain.handle('pokemon:getAll', async () => {
  try {
    if (!cache) cache = await loadAllPokemon();
    return { ok: true, data: cache };
  } catch (error) {
    return { ok: false, error: 'No se pudo conectar con PokeAPI. Revisa tu conexión a internet.' };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Pokédex Explorer',
    backgroundColor: '#12141c',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
