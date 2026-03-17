let miGrafico; // Variable global para controlar el gráfico
let datosCache; // Guardamos los datos para no hacer fetch cada vez que cambies el tipo

async function cargarDatos(id = 1) { 
    try {
        const respuesta = await fetch(`http://localhost:3000/api/student/${id}/grades`);
        datosCache = await respuesta.json();
        
        if (datosCache.length > 0) {
            // 1. Extraemos el nombre de la primera fila 
            const nombreCompleto = `${datosCache[0].name} ${datosCache[0].surname}`;
            
            // 2. Actualizamos el HTML
            document.getElementById('tituloEstudiante').innerText = `Notas de: ${nombreCompleto}`;

            renderizarGrafico('bar'); 
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function renderizarGrafico(tipo) {
    const materias = datosCache.map(dato => dato.label);
    const notas = datosCache.map(dato => dato.value);

    // 1. Calcular el promedio (Suma de notas / cantidad de notas)
    const promedio = notas.reduce((a, b) => a + b, 0) / notas.length;

    // 2. Definir el color según el promedio
    let colorFondo;
    let colorBorde;

    if (promedio >= 90) {
        colorFondo = 'rgba(255, 215, 0, 0.6)'; // Dorado
        colorBorde = 'rgba(255, 215, 0, 1)';
    } else if (promedio < 70) {
        colorFondo = 'rgba(236, 14, 14, 0.5)'; // Rojo
        colorBorde = 'rgba(236, 14, 14, 1)';
    } else {
        colorFondo = 'rgba(54, 162, 235, 0.5)'; // Azul estándar
        colorBorde = 'rgba(54, 162, 235, 1)';
    }

    const ctx = document.getElementById('graphCanvas').getContext('2d');

    if (miGrafico) {
        miGrafico.destroy();
    }

    // 3. Crear el gráfico con los colores dinámicos
    miGrafico = new Chart(ctx, {
        type: tipo,
        data: {
            labels: materias,
            datasets: [{
                label: `Notas (Promedio: ${promedio.toFixed(1)})`,
                data: notas,
                backgroundColor: colorFondo,
                borderColor: colorBorde,
                borderWidth: 2
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}
    

// Esta función la llaman los botones del HTML
function cambiarTipo(nuevoTipo) {
    renderizarGrafico(nuevoTipo);
}
function cambiarEstudiante() {
    const id = document.getElementById('studentSelector').value;
    cargarDatos(id); // ¡Magia! La gráfica se actualiza con el nuevo fetch
}
function descargarReporte() {
    if (!miGrafico) return alert("Primero carga una gráfica");

    // 1. Convertir el canvas a una URL de imagen (base64)
    const imagenBase64 = miGrafico.toBase64Image();

    // 2. Crear un enlace "fantasma" en el DOM
    const link = document.createElement('a');
    link.download = `Reporte_${datosCache[0].name}.png`; // Nombre del archivo
    link.href = imagenBase64;

    // 3. Simular el clic y eliminar el enlace
    link.click();
}
cargarDatos();


