# Pokédex Explorer

Aplicación de escritorio hecha con Electron que consulta la API pública [PokéAPI](https://pokeapi.co/). Muestra los 493 Pokémon hasta la cuarto generación y permite buscarlos por nombre o número, y filtrarlos por tipo, habilidad, altura y peso.

## API utilizada

- **PokéAPI v2**: https://pokeapi.co/docs/v2
- Acceso público y gratuito, **no requiere clave**. HTTP/REST con respuestas en JSON.

## Funcionalidades

- **Listado**: tarjetas con imagen, número, nombre, tipos, altura, peso, estadísticas (PS, ataque y defensa) y habilidades.
- **Buscador**: por nombre o por número, sin distinguir mayúsculas ni acentos.
- **Filtros** (se pueden combinar): tipo, habilidad, altura y peso.
- **Orden**: por número, nombre, ataque, peso o altura.


## Instrucciones de ejecución

1. Clonar el repositorio y entrar a la carpeta del proyecto. (https://github.com/qlevi715-sys/Web-poke-api)
2. Instalar las dependencias:
   ```
   npm install
   ```
3. Ejecutar la aplicación:
   ```
   npm start
   ```
## Estructura del proyecto

```
pokedex-explorer/
├── package.json
├── main.js             
├── preload.js           
├── src/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js     
└── assets/
    └── icon.png
```


## Autor

Olmert Levi Quintanilla Hernandez
