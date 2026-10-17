const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getPokemon: () => ipcRenderer.invoke('pokemon:getAll')
});
