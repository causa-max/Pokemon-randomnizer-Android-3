let bufferRomOriginal = null;

// Lista de las 386 IDs de Pokémon válidas en la Tercera Generación (GBA)
// Excluye los espacios vacíos internos (252 al 276) del motor para evitar congelamientos en Pizza Boy
const LISTA_POKEMON = Array.from({ length: 386 }, (_, i) => i + 1).filter(id => {
    return !(id >= 252 && id <= 276);
});

// Escuchador de carga de archivos (Compatible con almacenamiento local de Android)
document.getElementById('rom-file').addEventListener('change', function(evento) {
    const archivos = evento.target.files;
    if (!archivos || archivos.length === 0) return;
    const archivo = archivos[0];

    const pesoEnMB = (archivo.size / 1024 / 1024).toFixed(2);
    document.getElementById('file-info').innerText = `${archivo.name} (${pesoEnMB} MB)`;

    const lector = new FileReader();
    lector.onload = function(eventoLectura) {
        bufferRomOriginal = eventoLectura.target.result;
        document.getElementById('btn-process').disabled = false;
        console.log("ROM cargada con éxito en la memoria local.");
    };
    lector.readAsArrayBuffer(archivo);
});

// Algoritmo de barajado Fisher-Yates (Pura aleatorización local)
function barajarLista(listaOriginal) {
    let listaCopia = [...listaOriginal];
    for (let i = listaCopia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [listaCopia[i], listaCopia[j]] = [listaCopia[j], listaCopia[i]];
    }
    return listaCopia;
}

// Obtener un Pokémon aleatorio de la lista limpia
function obtenerPokemonAleatorio() {
    const indice = Math.floor(Math.random() * LISTA_POKEMON.length);
    return LISTA_POKEMON[indice];
}

document.getElementById('btn-process').addEventListener('click', function() {
    if (!bufferRomOriginal) return;

    let bufferModificado = bufferRomOriginal.slice(0);
    let vistaDatos = new DataView(bufferModificado);

    // ==========================================
    // 1. ALEATORIZAR INICIALES (Mesa del Lab)
    // ==========================================
    if (document.getElementById('rand-starters').checked) {
        const iniciales = barajarLista(LISTA_POKEMON);
        // Offsets exactos para Pokémon Rojo Fuego (Español v1.0)
        const offsetBulbasaur = 0x3F1498; 
        const offsetCharmander = 0x3F14A4;
        const offsetSquirtle   = 0x3F14B0;

        try {
            vistaDatos.setUint16(offsetBulbasaur, iniciales[0], true);
            vistaDatos.setUint16(offsetCharmander, iniciales[1], true);
            vistaDatos.setUint16(offsetSquirtle, iniciales[2], true);
            console.log("Iniciales aleatorizados de forma masiva.");
        } catch (e) { console.error("Error en iniciales:", e); }
    }

    // ==========================================
    // 2. ALEATORIZAR ENCUENTROS SALVAJES (Rutas, Cuevas y Agua)
    // ==========================================
    if (document.getElementById('rand-wild').checked) {
        // En Rojo Fuego ES, la tabla maestra de datos de encuentros salvajes inicia en este bloque
        const inicioTablaEncuentros = 0x3C9D20; 
        const finTablaEncuentros = 0x3CA500; 

        // Avanzamos de 2 en 2 bytes buscando y reemplazando IDs de Pokémon salvajes
        for (let offset = inicioTablaEncuentros; offset < finTablaEncuentros; offset += 2) {
            try {
                let idActual = vistaDatos.getUint16(offset, true);
                // Si el byte contiene un Pokémon válido de la fauna original, lo barajamos
                if (idActual > 0 && idActual <= 386 && !(idActual >= 252 && idActual <= 276)) {
                    vistaDatos.setUint16(offset, obtenerPokemonAleatorio(), true);
                }
            } catch (e) { break; }
        }
        console.log("Todos los encuentros salvajes de las rutas han sido modificados.");
    }

    // ==========================================
    // 3. ALEATORIZAR ESTADÍSTICAS BASE (Balance de combate)
    // ==========================================
    if (document.getElementById('rand-stats').checked) {
        // La tabla con los datos base (PS, Ataque, Defensa, Velocidad, At. Esp, Def. Esp)
        // Cada Pokémon ocupa exactamente 28 bytes de datos en este bloque estructural
        const inicioTablaStats = 0x254784; 
        const bytesPorPokemon = 28;

        for (let i = 0; i < 386; i++) {
            let offsetPokemon = inicioTablaStats + (i * bytesPorPokemon);
            try {
                // Barajamos los primeros 6 bytes correspondientes a los atributos de combate
                let stats = [];
                for (let s = 0; s < 6; s++) {
                    stats.push(vistaDatos.getUint8(offsetPokemon + s));
                }
                stats = barajarLista(stats); // Reordenamos las estadísticas de forma proporcional
                for (let s = 0; s < 6; s++) {
                    vistaDatos.setUint8(offsetPokemon + s, stats[s]);
                }
            } catch (e) { break; }
        }
        console.log("Estadísticas base modificadas de manera interna.");
    }

    // ==========================================
    // 4. ALEATORIZAR EQUIPOS DE ENTRENADORES (Líderes, Rivales, etc.)
    // ==========================================
    if (document.getElementById('rand-trainers').checked) {
        // Bloque donde residen las estructuras de los equipos Pokémon de los entrenadores rivales
        const inicioTablaEntrenadores = 0x310390; 
        const finTablaEntrenadores = 0x31A200;

        for (let offset = inicioTablaEntrenadores; offset < finTablaEntrenadores; offset += 2) {
            try {
                let idActual = vistaDatos.getUint16(offset, true);
                // Detecta IDs asignadas a entrenadores y las cambia por un Pokémon aleatorio jugable
                if (idActual > 0 && idActual <= 386 && !(idActual >= 252 && idActual <= 276)) {
                    vistaDatos.setUint16(offset, obtenerPokemonAleatorio(), true);
                }
            } catch (e) { break; }
        }
        console.log("Todos los equipos de entrenadores han sido alterados para el reto.");
    }

    // ==========================================
    // EXPORTACIÓN FINAL COMPATIBLE CON PIZZA BOY
    // ==========================================
    const blobBinario = new Blob([bufferModificado], { type: "application/octet-stream" });
    const enlaceDescarga = document.createElement('a');
    enlaceDescarga.href = URL.createObjectURL(blobBinario);
    
    // Forzamos un nombre limpio para evitar que Pizza Boy duplique archivos de guardado (.sav) erróneos
    enlaceDescarga.download = "pokemon_rojo_fuego_random.gba"; 
    enlaceDescarga.click();
});
          
