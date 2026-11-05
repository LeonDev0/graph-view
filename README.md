# Student Analytics Dashboard

Graph-view es una aplicación web full-stack para visualizar rendimiento académico y explorar datos tabulares externos. El proyecto utiliza una base de datos relacional para las notas y un visualizador en el navegador para archivos CSV, XLS y XLSX.

## Funcionalidades

* **Base de datos relacional:** SQLite con tablas relacionadas de estudiantes, materias y calificaciones.
* **API dinámica:** Backend Node.js/Express para consultar las notas de un estudiante.
* **Gráficas interactivas:** Chart.js permite cambiar entre barras y líneas.
* **Alertas visuales de rendimiento:**
  * Rojo para una materia o promedio inferior a `60.00`.
  * Naranja para una materia o promedio inferior a `75.00`.
  * Verde azulado para valores iguales o superiores a `75.00`.
* **Carga de datos externos:** Lectura local de archivos CSV, XLS y XLSX mediante SheetJS.
* **Limpieza y transformación:** Normalización de encabezados y valores, conversión numérica segura, filtros, ordenamiento y agrupación por categoría o prefijo.
* **Zoom para datasets externos:** Controles de acercar, alejar y restablecer la vista para explorar conjuntos con muchas filas sin perder legibilidad.
* **Exportación PNG:** Descarga del gráfico externo activo o, como alternativa, del gráfico de estudiantes con un fondo sólido.
* **Interfaz responsive:** Diseño oscuro, controles accesibles y adaptación a pantallas pequeñas.

## Stack tecnológico

* **Frontend:** HTML5, CSS3 y JavaScript ES6+.
* **Visualización:** Chart.js.
* **Lectura de archivos:** SheetJS/XLSX.
* **Backend:** Node.js y Express.js.
* **Base de datos:** SQLite3.

## Estructura principal

```text
├── db.js             # Esquema y datos iniciales de SQLite
├── index.js          # API existente y lógica del visualizador frontend
├── index.html        # Interfaz del dashboard
├── styles.css        # Estilos del dashboard
├── package.json      # Dependencias y scripts
└── README.md         # Documentación del proyecto
```

## Instalación y ejecución

Clona el repositorio e instala las dependencias:

```bash
git clone (https://leondev0.github.io/graph-view/)
cd your-repo-name
npm install
```

Inicializa los datos mediante la lógica de seed del proyecto y ejecuta la aplicación:

```bash
node index.js
```

Abre <http://localhost:3000> en el navegador.

> El script `start` configurado actualmente utiliza Nodemon con `db.js`. Para el uso diario, confirma que el comando de inicio apunte al archivo del servidor que expone la API.

## Uso del visualizador externo

1. Selecciona un archivo CSV, XLS o XLSX.
2. Elige la columna para el eje X y la columna numérica para el eje Y.
3. Usa el ordenamiento ascendente o descendente según el valor Y.
4. Selecciona una categoría para filtrar o activa la agrupación automática.
5. Utiliza **Acercar**, **Alejar** o **Restablecer** para revisar datasets grandes.
6. Descarga el gráfico activo en formato PNG.

Los archivos se procesan localmente en el navegador. Aun así, conviene aplicar límites de tamaño y validación de tipo también en el servidor si en el futuro los archivos se envían a una API.

## Seguridad

La página incluye políticas de contenido, permisos y referencia, además de restricciones contra incrustación en frames, objetos no autorizados y MIME sniffing. Para producción:

* Sirve la aplicación exclusivamente mediante HTTPS.
* Envía estas políticas como cabeceras HTTP desde el servidor; las etiquetas HTML son una defensa complementaria.
* Sustituye el origen de desarrollo `http://localhost:3000` por el dominio HTTPS real.
* Hospeda las librerías externas o añade hashes SRI verificables para los recursos CDN.
* Valida tamaño, extensión y contenido de cualquier archivo recibido en el backend.
* Mantén consultas SQL parametrizadas y añade autenticación/autorización para datos académicos.
* Evita exponer la base de datos SQLite directamente al cliente.

## Uso de Copilot

GitHub Copilot ha sido utilizado como agente de corrección de código y como apoyo prioritario en la corrección y refactorización del visualizador de datos externos. Su intervención se centró en la limpieza de datos, generación de gráficas, filtros, agrupación, zoom, exportación PNG y revisión de la documentación.

## Aprendizajes

Este proyecto demuestra cómo pasar de un modelo plano a una estructura relacional y cómo conectar una API con visualizaciones interactivas. También muestra la importancia de normalizar datos importados, ofrecer controles para datasets grandes y documentar las medidas de seguridad de una aplicación que maneja información académica.

Desarrollado por LeoDEV.
