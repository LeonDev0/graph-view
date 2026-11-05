let datosCache = [];
let datosExcel = [];
let graficoEstudiantes = null;
let graficoExcel = null;

const externalState = {
    colX: '',
    colY: '',
    colCategory: '',
    categoryFilter: '',
    sortDirection: 'none',
    groupByCategory: false
};

const $ = (id) => document.getElementById(id);

function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
}

function setDisplay(id, display) {
    const element = $(id);
    if (element) element.style.display = display;
}

function limpiarTexto(value) {
    return typeof value === 'string' ? value.trim() : value;
}

function parsearNumero(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = Number.parseFloat(String(value ?? '').trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
}

function normalizarFilas(rows) {
    return rows
        .map((row) => Object.entries(row).reduce((cleanRow, [key, value]) => {
            const cleanKey = limpiarTexto(key);
            if (cleanKey) cleanRow[cleanKey] = limpiarTexto(value);
            return cleanRow;
        }, {}))
        .filter((row) => Object.values(row).some((value) => String(value ?? '').trim() !== ''));
}

function detectarColumnas(rows) {
    return [...new Set(rows.flatMap((row) => Object.keys(row)))];
}

function esNumero(value) {
    return String(value ?? '').trim() !== '' && Number.isFinite(parsearNumero(value));
}

function detectarColumnaNumerica(columns, rows) {
    return columns.find((column) => {
        const values = rows.map((row) => row[column]).filter((value) => String(value ?? '').trim() !== '');
        return values.length > 0 && values.filter(esNumero).length / values.length >= 0.6;
    }) || '';
}

function detectarColumnaCategoria(columns, rows, colY) {
    const preferred = columns.find((column) => /categor[ií]a|category|tipo|grupo|group|familia/i.test(column));
    if (preferred && preferred !== colY) return preferred;

    return columns.find((column) => {
        if (column === colY) return false;
        const values = rows.map((row) => String(row[column] ?? '').trim()).filter(Boolean);
        return values.length > 1 && new Set(values).size < values.length;
    }) || '';
}

function obtenerPrefijo(value) {
    return String(value ?? '').trim().split(/\s*[-|:/]\s*/)[0] || String(value ?? '').trim();
}

function configurarSelect(id, options, selected = '') {
    const select = $(id);
    if (!select) return;

    select.replaceChildren();
    options.forEach(({ value, label }) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        option.selected = value === selected;
        select.appendChild(option);
    });
}

function obtenerCategoria(row) {
    if (externalState.colCategory === '__prefix__') {
        return obtenerPrefijo(row[externalState.colX]);
    }
    return String(row[externalState.colCategory] ?? '').trim();
}

function actualizarFiltroCategorias() {
    const categorySelect = $('selectCategory');
    const filterSelect = $('categoryFilter');
    if (!categorySelect || !filterSelect) return;

    const category = categorySelect.value;
    const values = category === '__prefix__'
        ? datosExcel.map((row) => obtenerPrefijo(row[externalState.colX]))
        : datosExcel.map((row) => String(row[category] ?? '').trim());
    const uniqueValues = [...new Set(values)].filter(Boolean).sort((a, b) => a.localeCompare(b, 'es'));

    configurarSelect('categoryFilter', [
        { value: '', label: 'Todas las categorías' },
        ...uniqueValues.map((value) => ({ value, label: value }))
    ], externalState.categoryFilter);

    if (!uniqueValues.includes(externalState.categoryFilter)) {
        externalState.categoryFilter = '';
        filterSelect.value = '';
    }
}

function prepararControles(rows) {
    const columns = detectarColumnas(rows);
    const colY = detectarColumnaNumerica(columns, rows) || columns[1] || columns[0] || '';
    const colX = columns.find((column) => column !== colY) || columns[0] || '';
    const categoryColumn = detectarColumnaCategoria(columns, rows, colY);

    externalState.colX = colX;
    externalState.colY = colY;
    externalState.colCategory = categoryColumn;
    externalState.categoryFilter = '';

    const columnOptions = columns.map((column) => ({ value: column, label: column }));
    configurarSelect('selectX', columnOptions, colX);
    configurarSelect('selectY', columnOptions, colY);
    configurarSelect('selectCategory', [
        { value: '', label: 'Sin agrupación' },
        ...columnOptions.map((option) => ({ value: option.value, label: `Columna: ${option.label}` })),
        { value: '__prefix__', label: 'Prefijo del nombre' }
    ], categoryColumn);
    actualizarFiltroCategorias();
    setDisplay('mappingControls', 'flex');
    setDisplay('downloadExternalButton', 'inline-flex');
}

function transformarDatosExternos() {
    let rows = datosExcel.filter((row) => {
        return !externalState.categoryFilter || obtenerCategoria(row) === externalState.categoryFilter;
    });

    if (externalState.groupByCategory && externalState.colCategory) {
        const groups = new Map();
        rows.forEach((row) => {
            const category = obtenerCategoria(row) || 'Sin categoría';
            const current = groups.get(category) || { total: 0, count: 0 };
            current.total += parsearNumero(row[externalState.colY]);
            current.count += 1;
            groups.set(category, current);
        });
        rows = [...groups.entries()].map(([label, values]) => ({
            [externalState.colX]: label,
            [externalState.colY]: values.total / values.count
        }));
    }

    const data = rows.map((row) => ({
        label: limpiarTexto(row[externalState.colX]) || 'Sin etiqueta',
        value: parsearNumero(row[externalState.colY])
    }));

    if (externalState.sortDirection === 'asc') data.sort((a, b) => a.value - b.value);
    if (externalState.sortDirection === 'desc') data.sort((a, b) => b.value - a.value);
    return data;
}

function configurarTamanoGrafica(canvas, frame, itemCount) {
    if (!canvas || !frame) return false;
    const isLarge = itemCount > 20;
    frame.style.overflowX = 'hidden';
    canvas.style.removeProperty('width');
    canvas.style.height = isLarge ? '360px' : '300px';
    return isLarge;
}

function obtenerColoresGrafica(data, promedio) {
    if (promedio < 60) {
        return {
            background: data.map(() => 'rgba(239, 68, 68, 0.65)'),
            border: data.map(() => '#ef4444')
        };
    }
    if (promedio < 75) {
        return {
            background: data.map(() => 'rgba(249, 115, 22, 0.65)'),
            border: data.map(() => '#f97316')
        };
    }
    return {
        background: data.map((value) => parsearNumero(value) < 60
            ? 'rgba(239, 68, 68, 0.65)'
            : parsearNumero(value) < 75
                ? 'rgba(249, 115, 22, 0.65)'
                : 'rgba(85, 214, 190, 0.55)'),
        border: data.map((value) => parsearNumero(value) < 60
            ? '#ef4444'
            : parsearNumero(value) < 75
                ? '#f97316'
                : '#55d6be')
    };
}

function renderizarGrafico(tipo, labels, data, titulo, canvasId = 'graphCanvas') {
    const canvas = $(canvasId);
    if (!canvas) return null;

    const frame = canvas.closest('.chart-frame');
    const isLarge = configurarTamanoGrafica(canvas, frame, labels.length);
    const promedio = data.length
        ? data.reduce((sum, value) => sum + parsearNumero(value), 0) / data.length
        : 0;
    const colors = obtenerColoresGrafica(data, promedio);
    const previousChart = canvasId === 'externalCanvas' ? graficoExcel : graficoEstudiantes;
    if (previousChart) previousChart.destroy();

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: (context) => `${context.dataset.label}: ${parsearNumero(context.raw).toFixed(2)}`
                }
            },
            legend: { display: true }
        },
        scales: {
            x: {
                ticks: {
                    autoSkip: isLarge,
                    maxTicksLimit: isLarge ? 12 : undefined,
                    maxRotation: 45,
                    minRotation: 0
                }
            },
            y: { beginAtZero: true }
        }
    };

    if (canvasId === 'externalCanvas') {
        options.plugins.zoom = {
            pan: { enabled: true, mode: 'x' },
            zoom: {
                wheel: { enabled: true },
                pinch: { enabled: true },
                mode: 'x'
            }
        };
    }

    const chart = new Chart(canvas.getContext('2d'), {
        type: tipo,
        data: {
            labels,
            datasets: [{
                label: `${titulo} (Prom: ${promedio.toFixed(1)})`,
                data,
                backgroundColor: colors.background,
                borderColor: colors.border,
                borderWidth: 2
            }]
        },
        options
    });

    if (canvasId === 'externalCanvas') graficoExcel = chart;
    else graficoEstudiantes = chart;
    return chart;
}

async function cargarDatos(id = 1) {
    try {
        const response = await fetch(`http://localhost:3000/api/student/${encodeURIComponent(id)}/grades`);
        if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
        datosCache = await response.json();
        if (!datosCache.length) throw new Error('No hay notas para este estudiante.');

        const first = datosCache[0];
        setText('tituloEstudiante', `Notas de: ${first.name ?? ''} ${first.surname ?? ''}`.trim());
        const labels = datosCache.map((item) => item.label);
        const values = datosCache.map((item) => parsearNumero(item.value));
        renderizarGrafico('bar', labels, values, 'Notas');
    } catch (error) {
        setText('tituloEstudiante', 'No se pudieron cargar las notas.');
        console.error('Error cargando notas:', error);
    }
}

function cambiarTipo(nuevoTipo) {
    if (!datosCache.length) return;
    renderizarGrafico(
        nuevoTipo,
        datosCache.map((item) => item.label),
        datosCache.map((item) => parsearNumero(item.value)),
        'Notas'
    );
}

function cambiarEstudiante() {
    const input = $('studentSelector');
    if (!input) return;
    const id = Number.parseInt(input.value, 10);
    if (Number.isInteger(id) && id > 0) cargarDatos(id);
}

function mostrarErrorArchivo(message) {
    const help = $('file-help');
    if (help) {
        help.textContent = message;
        help.classList.add('error-message');
    }
}

function cargarArchivo(file) {
    if (!file || typeof XLSX === 'undefined') {
        mostrarErrorArchivo('No se pudo iniciar la lectura del archivo.');
        return;
    }

    mostrarErrorArchivo('Los datos se procesan en tu navegador.');
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const workbook = XLSX.read(new Uint8Array(event.target.result), { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            if (!firstSheet) throw new Error('El archivo no contiene hojas.');

            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
            datosExcel = normalizarFilas(rows);
            if (!datosExcel.length) throw new Error('No se encontraron filas con datos.');

            prepararControles(datosExcel);
            generarGraficaDesdeExcel();
        } catch (error) {
            datosExcel = [];
            setDisplay('mappingControls', 'none');
            setDisplay('downloadExternalButton', 'none');
            mostrarErrorArchivo(`No se pudo leer el archivo: ${error.message}`);
            console.error('Error leyendo archivo externo:', error);
        }
    };
    reader.onerror = () => mostrarErrorArchivo('No se pudo leer el archivo seleccionado.');
    reader.readAsArrayBuffer(file);
}

function generarGraficaDesdeExcel() {
    if (!datosExcel.length || !externalState.colX || !externalState.colY) return;
    const data = transformarDatosExternos();
    if (!data.length) {
        mostrarErrorArchivo('El filtro seleccionado no tiene datos.');
        return;
    }

    renderizarGrafico(
        'bar',
        data.map((item) => item.label),
        data.map((item) => item.value),
        `Datos de ${externalState.colY}`,
        'externalCanvas'
    );
    actualizarEstadoZoom();
}

function crearControlesZoom() {
    let controls = $('externalZoomControls');
    if (controls || !$('mappingControls')) return controls;

    controls = document.createElement('div');
    controls.id = 'externalZoomControls';
    controls.className = 'controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Controles de zoom de la gráfica externa');
    controls.style.display = 'none';

    [
        ['zoomOutButton', '-', 'Alejar'],
        ['zoomInButton', '+', 'Acercar'],
        ['zoomResetButton', 'reestablecer', 'Restablecer zoom']
    ].forEach(([id, text, label]) => {
        const button = document.createElement('button');
        button.id = id;
        button.type = 'button';
        button.className = 'button button-secondary';
        button.textContent = text;
        button.setAttribute('aria-label', label);
        controls.appendChild(button);
    });

    $('mappingControls').after(controls);
    const zoomOut = $('zoomOutButton');
    const zoomIn = $('zoomInButton');
    const reset = $('zoomResetButton');
    if (zoomOut) zoomOut.addEventListener('click', () => graficoExcel?.zoom(0.8));
    if (zoomIn) zoomIn.addEventListener('click', () => graficoExcel?.zoom(1.2));
    if (reset) reset.addEventListener('click', () => graficoExcel?.resetZoom());
    return controls;
}

function actualizarEstadoZoom() {
    const controls = crearControlesZoom();
    if (controls) controls.style.display = datosExcel.length > 1 ? 'flex' : 'none';
}

function descargarReporte(canvasId) {
    const chart = canvasId === 'externalCanvas'
        ? graficoExcel
        : graficoExcel || graficoEstudiantes;
    if (!chart) return;

    const source = new Image();
    source.onload = () => {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = source.width;
        exportCanvas.height = source.height;
        const context = exportCanvas.getContext('2d');
        if (!context) return;

        context.fillStyle = '#111a2b';
        context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        context.drawImage(source, 0, 0);

        const link = document.createElement('a');
        link.download = `graph-view-${canvasId === 'externalCanvas' ? 'datos-externos' : 'estudiante'}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    };
    source.src = chart.toBase64Image();
}

function inicializarEventos() {
    const helpButton = $('helpButton');
    const helpPanel = $('helpPanel');
    if (helpButton && helpPanel) {
        helpButton.addEventListener('click', () => {
            const isOpen = !helpPanel.hidden;
            helpPanel.hidden = isOpen;
            helpButton.setAttribute('aria-expanded', String(!isOpen));
        });
    }

    setDisplay('downloadExternalButton', 'none');
    const fileInput = $('fileInput');
    if (fileInput) fileInput.addEventListener('change', (event) => cargarArchivo(event.target.files?.[0]));

    const selectX = $('selectX');
    if (selectX) selectX.addEventListener('change', (event) => {
        externalState.colX = event.target.value;
        actualizarFiltroCategorias();
    });

    const selectY = $('selectY');
    if (selectY) selectY.addEventListener('change', (event) => {
        externalState.colY = event.target.value;
    });

    const selectCategory = $('selectCategory');
    if (selectCategory) selectCategory.addEventListener('change', (event) => {
        externalState.colCategory = event.target.value;
        externalState.categoryFilter = '';
        actualizarFiltroCategorias();
    });

    const categoryFilter = $('categoryFilter');
    if (categoryFilter) categoryFilter.addEventListener('change', (event) => {
        externalState.categoryFilter = event.target.value;
    });

    const sortDirection = $('sortDirection');
    if (sortDirection) sortDirection.addEventListener('change', (event) => {
        externalState.sortDirection = event.target.value;
    });

    const groupByCategory = $('groupByCategory');
    if (groupByCategory) groupByCategory.addEventListener('change', (event) => {
        externalState.groupByCategory = event.target.checked;
    });

    crearControlesZoom();
}

function registrarPluginZoom() {
    const plugin = window.ChartZoom || window.zoomPlugin || window['chartjs-plugin-zoom'];
    if (plugin && typeof Chart !== 'undefined' && typeof Chart.register === 'function') {
        Chart.register(plugin);
    }
}

registrarPluginZoom();
inicializarEventos();
actualizarEstadoZoom();
cargarDatos();
