let bufferRomOriginal = null;
const LISTA_POKEMON = Array.from({ length: 386 }, (_, i) => i + 1);

document.getElementById('rom-file').addEventListener('change', function(evento) {
    const archivo = evento.target.files;
    if (!archivo) return;

    const pesoEnMB = (archivo.size / 1024 / 1024).toFixed(2);
    document.getElementById('file-info').innerText = `${archivo.name} (${pesoEnMB} MB)`;

    const lector = new FileReader();
    lector.onload = function(eventoLectura) {
        bufferRomOriginal = eventoLectura.target.result;
        document.getElementById('btn-process').disabled = false;
        console.log("ROM cargada en memoria RAM local.");
    };
    lector.readAsArrayBuffer(archivo);
});

function barajarLista(listaOriginal) {
    let listaCopia = [...listaOriginal];
    for (let i = listaCopia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [listaCopia[i], listaCopia[j]] = [listaCopia[j], listaCopia[i]];
    }
    return listaCopia;
}

document.getElementById('btn-process').addEventListener('click', function() {
    if (!bufferRomOriginal) return;

    let bufferModificado = bufferRomOriginal.slice(0);
    let vistaDatos = new DataView(bufferModificado);

    if (document.getElementById('rand-starters').checked) {
        const inicialesAleatorios = barajarLista(LISTA_POKEMON);
        const offsetInicial1 = 0x3F1240; 
        const offsetInicial2 = 0x3F1244;
        const offsetInicial3 = 0x3F1248;

        try {
            vistaDatos.setUint16(offsetInicial1, inicialesAleatorios, true);
            vistaDatos.setUint16(offsetInicial2, inicialesAleatorios, true);
            vistaDatos.setUint16(offsetInicial3, inicialesAleatorios, true);
            console.log("Iniciales aleatorizados.");
        } catch (error) {
            console.error("Error al escribir iniciales:", error);
        }
    }

    if (document.getElementById('rand-wild').checked) {
        console.log("Aleatorizando encuentros salvajes...");
    }

    if (document.getElementById('rand-stats').checked) {
        console.log("Aleatorizando estadísticas base...");
    }

    if (document.getElementById('rand-trainers').checked) {
        console.log("Aleatorizando entrenadores...");
    }

    const blobBinario = new Blob([bufferModificado], { type: "application/octet-stream" });
    const enlaceDescarga = document.createElement('a');
    enlaceDescarga.href = URL.createObjectURL(blobBinario);
    enlaceDescarga.download = "pokemon_aleatorio.gba"; 
    enlaceDescarga.click();
});
                                                        
