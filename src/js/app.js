'use strict';

const TYPE_ES = {
    normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta', electric: 'Eléctrico',
    ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador',
    psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón',
    dark: 'Siniestro', steel: 'Acero', fairy: 'Hada'
};

const state = {
    pokemon: [],
    filters: { text: '', type: '', ability: '', height: '', weight: '' },
    sort: 'id'
};

// --- Variables de paginación ---

const POKEMON_POR_PAGINA = 25;
let paginaActual = 1;
let pokemonFiltrados = [];

const els = {
    grid: document.querySelector('#grid'),
    status: document.querySelector('#status'),
    count: document.querySelector('#count'),
    search: document.querySelector('#search'),
    type: document.querySelector('#filter-type'),
    ability: document.querySelector('#filter-ability'),
    height: document.querySelector('#filter-height'),
    weight: document.querySelector('#filter-weight'),
    sort: document.querySelector('#sort'),
    clear: document.querySelector('#clear'),
    template: document.querySelector('#pokemon-template'),
    // Elementos de paginación
    btnAnterior: document.querySelector('#btn-anterior'),
    btnSiguiente: document.querySelector('#btn-siguiente'),
    infoPagina: document.querySelector('#info-pagina')
};

// ---------- Utilidades ----------

const normalize = (text) =>
    (text || '')
        .toString()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();

const prettify = (slug) => {
    const text = slug.replace(/-/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
};

const typeLabel = (type) => TYPE_ES[type] || prettify(type);

const formatNumber = (id) => `#${String(id).padStart(3, '0')}`;

const setStatus = (message, isError = false) => {
    els.status.textContent = message;
    els.status.classList.toggle('error', isError);
};

const heightGroup = (m) => (m < 0.6 ? 'small' : m <= 1.5 ? 'medium' : 'large');
const weightGroup = (kg) => (kg < 10 ? 'light' : kg <= 50 ? 'medium' : 'heavy');

// ---------- Filtros y busqueda ----------

function getFiltered() {
    const { text, type, ability, height, weight } = state.filters;
    const query = normalize(text).replace(/^#/, '');

    const list = state.pokemon.filter((p) => {
        if (query) {
            const byName = normalize(p.name).includes(query);
            const byNumber = String(p.id) === query || formatNumber(p.id).slice(1) === query;
            if (!byName && !byNumber) return false;
        }
        if (type && !p.types.includes(type)) return false;
        if (ability && !p.abilities.some((a) => a.name === ability)) return false;
        if (height && heightGroup(p.height) !== height) return false;
        if (weight && weightGroup(p.weight) !== weight) return false;
        return true;
    });

    const sorters = {
        id: (a, b) => a.id - b.id,
        name: (a, b) => a.name.localeCompare(b.name),
        attack: (a, b) => (b.attack || 0) - (a.attack || 0),
        weight: (a, b) => b.weight - a.weight,
        height: (a, b) => b.height - a.height
    };

    return list.sort(sorters[state.sort]);
}

// ---------- Renderizado ----------

function render() {
    pokemonFiltrados = getFiltered();

    const totalPaginas = Math.max(1, Math.ceil(pokemonFiltrados.length / POKEMON_POR_PAGINA));
        if (paginaActual > totalPaginas) paginaActual = totalPaginas;
        if (paginaActual < 1) paginaActual = 1;

    els.infoPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    els.btnAnterior.disabled = paginaActual === 1;
    els.btnSiguiente.disabled = paginaActual === totalPaginas;

    const inicio = (paginaActual - 1) * POKEMON_POR_PAGINA;
    const fin = inicio + POKEMON_POR_PAGINA;
    const list = pokemonFiltrados.slice(inicio, fin);

    els.grid.replaceChildren();
    els.count.textContent = `${pokemonFiltrados.length} de ${state.pokemon.length} Pokémon`;
    setStatus(pokemonFiltrados.length === 0 ? 'No se encontraron Pokémon con esos criterios.' : '');

    const fragment = document.createDocumentFragment();

    list.forEach((p) => {
        const card = els.template.content.cloneNode(true);

        const img = card.querySelector('.poster-img');
        const noImage = card.querySelector('.no-poster');
        if (p.image) {
            img.src = p.image;
            img.alt = `Imagen de ${prettify(p.name)}`;
        } else {
            img.classList.add('hidden');
            noImage.classList.remove('hidden');
        }

        card.querySelector('.number').textContent = formatNumber(p.id);
        card.querySelector('.title').textContent = prettify(p.name);

        const typesList = card.querySelector('.types');
        p.types.forEach((t) => {
            const li = document.createElement('li');
            li.textContent = typeLabel(t);
            li.classList.add(`type-${t}`);
            typesList.appendChild(li);
        });

        card.querySelector('.meta').textContent = `Altura: ${p.height} m · Peso: ${p.weight} kg`;
        card.querySelector('.stats').textContent =
            `PS ${p.hp} · Ataque ${p.attack} · Defensa ${p.defense}`;
        card.querySelector('.abilities').textContent =
            'Habilidades: ' +
            p.abilities.map((a) => prettify(a.name) + (a.hidden ? ' (oculta)' : '')).join(', ');

        fragment.appendChild(card);
    });

    els.grid.appendChild(fragment);
}

// ---------- Selectores de filtros ----------

function addOption(select, value, label) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
}

function fillFilters() {
    const types = new Set(state.pokemon.flatMap((p) => p.types));
    [...types]
        .sort((a, b) => typeLabel(a).localeCompare(typeLabel(b), 'es'))
        .forEach((t) => addOption(els.type, t, typeLabel(t)));

    const abilities = new Set(state.pokemon.flatMap((p) => p.abilities.map((a) => a.name)));
    [...abilities]
        .sort((a, b) => a.localeCompare(b))
        .forEach((a) => addOption(els.ability, a, prettify(a)));
}

// ---------- Eventos ----------

let searchTimer;
els.search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        state.filters.text = els.search.value;
        paginaActual = 1;
        render();
    }, 200);
});

const bindFilter = (select, key) =>
    select.addEventListener('change', () => {
        state.filters[key] = select.value;
        paginaActual = 1;
        render();
    });

bindFilter(els.type, 'type');
bindFilter(els.ability, 'ability');
bindFilter(els.height, 'height');
bindFilter(els.weight, 'weight');

els.sort.addEventListener('change', () => {
    state.sort = els.sort.value;
    paginaActual = 1; 
    render();
});

els.clear.addEventListener('click', () => {
    state.filters = { text: '', type: '', ability: '', height: '', weight: '' };
    state.sort = 'id';
    els.search.value = '';
    els.type.value = '';
    els.ability.value = '';
    els.height.value = '';
    els.weight.value = '';
    els.sort.value = 'id';
    paginaActual = 1; 
    render();
});

// --- Eventos de paginación ---
els.btnAnterior.addEventListener('click', () => {
    if (paginaActual > 1) {
        paginaActual--;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }
});

els.btnSiguiente.addEventListener('click', () => {
    const totalPaginas = Math.ceil(pokemonFiltrados.length / POKEMON_POR_PAGINA);
    if (paginaActual < totalPaginas) {
        paginaActual++;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }
});

// ---------- Inicio ----------

async function init() {
    setStatus('Cargando Pokémon... puede tardar unos segundos.');
    try {
        const res = await window.api.getPokemon();
        if (!res.ok) throw new Error(res.error);
        state.pokemon = res.data;
        fillFilters();
        render();
    } catch (error) {
        setStatus(error.message, true);
    }
}

init();