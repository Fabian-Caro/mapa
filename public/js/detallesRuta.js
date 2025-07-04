// Reemplaza con tu token real de Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoia2V2aW5kYWQxNSIsImEiOiJjbTEzdno5cjEwcmNqMmtvN21tN2p1Z2gzIn0.n6e-Ct4jOnl1xzsmILtVJA';

// Función para obtener parámetros de la URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function createCard(detalle, index) {
    return `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title"><i class="fas fa-map-marker-alt"></i> Punto ${index + 1}</h5>
            <p class="card-text"><i class="fas fa-address-card"></i> <strong>Dirección:</strong> ${detalle.direccion}</p>
            <p class="card-text"><i class="fas fa-globe"></i> <strong>Latitud:</strong> ${detalle.latitud}</p>
            <p class="card-text"><i class="fas fa-map-marker"></i> <strong>Longitud:</strong> ${detalle.longitud}</p>
            <p class="card-text"><i class="fas fa-box"></i> <strong>Número de Paquete:</strong> ${detalle.numeroPaquete}</p>
            <button class="btn btn-sm btn-danger" onclick="deleteDetalle('${rutaActual.id}', '${detalle.id}')"><i class="fas fa-trash"></i> Eliminar</button>
          </div>
        </div>
      `;
}

function showAlert(message, type = 'success') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    })

    Toast.fire({
        icon: type,
        title: message
    })
}

// Variables globales para almacenar la ruta actual y sus detalles
let rutaActual = null;
let detallesActuales = [];

// Coordenadas fijas de la bodega (formato [lng, lat])
const bodega = [-74.04488664305592, 4.757786586246297];

// Función para cargar la información de la ruta y sus detalles
async function fetchRutaDetails(routeId) {
    try {
        // Obtener la información principal de la ruta
        const rutaResponse = await fetch(`/api/rutas/${routeId}`);
        const rutaResult = await rutaResponse.json();

        if (!rutaResult.success) {
            document.getElementById('rutaInfo').innerHTML = `<p>${rutaResult.message}</p>`;
            return;
        }

        rutaActual = rutaResult.data;
        document.getElementById('rutaInfo').innerHTML = `
            <h4><i class="fas fa-route"></i> Ruta ${rutaActual.id}</h4>
            <p><i class="fas fa-user"></i> <strong>Conductor:</strong> ${rutaActual.conductor}</p>
            <p><i class="fas fa-truck"></i> <strong>Vehículo:</strong> ${rutaActual.vehiculo}</p>
            <p><i class="fas fa-calendar-alt"></i> <strong>Fecha:</strong> ${rutaActual.fecha}</p>
          `;

        // Obtener los detalles de la ruta
        const detallesResponse = await fetch(`/api/detalles-ruta/${rutaActual.id}`);
        const detallesResult = await detallesResponse.json();

        if (!detallesResult.success) {
            showAlert('Error al obtener detalles: ' + detallesResult.message, 'danger');
            return;
        }

        detallesActuales = detallesResult.data;
        renderDetalles(detallesActuales);
        optimizeAndDrawRoute(detallesActuales);
    } catch (error) {
        showAlert('Error al cargar la ruta: ' + error.message, 'danger');
    }
}

// Función para renderizar la lista de detalles de la ruta
function renderDetalles(detalles) {
    const container = document.getElementById('detalleList');
    container.innerHTML = '';
    if (detalles.length === 0) {
        container.innerHTML = '<p>No hay detalles de entrega registrados.</p>';
        return;
    }
    detalles.forEach((detalle, index) => {
        const card = createCard(detalle, index);
        container.innerHTML += card;
    });
}

// Función para calcular la distancia entre dos puntos (Haversine formula)
function calculateDistance(coord1, coord2) {
    const R = 6371e3; // metres
    const lat1 = coord1[1] * Math.PI / 180;
    const lat2 = coord2[1] * Math.PI / 180;
    const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const deltaLon = (coord2[0] - coord1[0]) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// Función para optimizar el orden de los puntos de entrega (Nearest Neighbor Algorithm)
function optimizeRoute(start, points) {
    let unvisited = [...points];
    let route = [];
    let current = start;

    while (unvisited.length > 0) {
        let nearest = null;
        let nearestIndex = -1;
        let minDistance = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
            const distance = calculateDistance(current, [unvisited[i].longitud, unvisited[i].latitud]);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = unvisited[i];
                nearestIndex = i;
            }
        }

        route.push(nearest);
        current = [nearest.longitud, nearest.latitud];
        unvisited.splice(nearestIndex, 1);
    }

    return route;
}

// Función para obtener la ruta entre dos puntos usando la API de Mapbox Directions
async function getRoute(start, end) {
    const startCoords = `${start[0]},${start[1]}`;
    const endCoords = `${end[0]},${end[1]}`;

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords};${endCoords}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            return data.routes[0].geometry.coordinates;
        } else {
            console.error('No se encontró una ruta:', data);
            return null;
        }
    } catch (error) {
        console.error('Error al obtener la ruta:', error);
        return null;
    }
}

// Función principal para trazar la ruta optimizada en el mapa usando Mapbox Directions API
async function optimizeAndDrawRoute(detalles) {
    if (!detalles || detalles.length === 0) {
        initializeMap([]);
        return;
    }

    const deliveryPoints = detalles.map(detalle => ({
        ...detalle,
        longitud: parseFloat(detalle.longitud),
        latitud: parseFloat(detalle.latitud)
    }));

    const optimizedRoute = optimizeRoute(bodega, deliveryPoints);

    let allCoords = [bodega];
    for (let i = 0; i < optimizedRoute.length; i++) {
        const start = allCoords[allCoords.length - 1];
        const end = [optimizedRoute[i].longitud, optimizedRoute[i].latitud];
        const routeCoords = await getRoute(start, end);

        if (routeCoords) {
            allCoords = allCoords.concat(routeCoords);
        } else {
            showAlert(`No se pudo obtener la ruta al punto ${i + 1}.`, 'danger');
            return;
        }
    }

    initializeMap(allCoords);
}

// Función para inicializar el mapa y trazar la ruta
function initializeMap(coords) {
    let center = bodega;
    if (coords.length > 0) {
        center = coords[0];
    }

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: center,
        zoom: 12
    });

    new mapboxgl.Marker({
        color: 'red'
    })
        .setLngLat(bodega)
        .setPopup(new mapboxgl.Popup().setHTML("<h6>Bodega</h6>"))
        .addTo(map);

    if (detallesActuales && detallesActuales.length > 0) {
        detallesActuales.forEach((detalle, index) => {
            new mapboxgl.Marker({
                color: 'blue'
            })
                .setLngLat([parseFloat(detalle.longitud), parseFloat(detalle.latitud)])
                .setPopup(new mapboxgl.Popup().setHTML(`<h6>Punto ${index + 1}</h6><p>${detalle.direccion}</p>`))
                .addTo(map);
        });
    }

    if (coords.length > 1) {
        map.on('load', () => {
            if (map.getSource('route')) {
                map.removeLayer('route');
                map.removeSource('route');
            }

            map.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coords
                    }
                }
            });

            map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#3887be',
                    'line-width': 5
                }
            });
        });
    }
}

// Función para agregar un nuevo detalle (punto de entrega)
document.getElementById('detalleForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const latitud = formData.get('latitud');
    const longitud = formData.get('longitud');
    const direccion = formData.get('direccion');
    const numeroPaquete = formData.get('numeroPaquete');

    if (!latitud || !longitud || !direccion || !numeroPaquete) {
        showAlert("Todos los campos del detalle son requeridos", "danger");
        return;
    }

    // Enviar solicitud para crear un nuevo detalle para la ruta actual
    fetch(`/api/detalles-ruta/${rutaActual.id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            latitud,
            longitud,
            direccion,
            numeroPaquete
        })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showAlert("Detalle agregado correctamente");
                fetchRutaDetails(rutaActual.id); // Recargar los detalles y actualizar el mapa
                // Cerrar el modal de detalle
                const modalEl = document.getElementById('detalleModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
                form.reset();
            } else {
                showAlert(result.message, "danger");
            }
        })
        .catch(error => showAlert("Error al agregar detalle: " + error.message, "danger"));
});

// Función para eliminar un detalle
function deleteDetalle(rutaId, detalleId) {
    if (confirm("¿Está seguro de eliminar este detalle?")) {
        fetch(`/api/detalles-ruta/${rutaId}/${detalleId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showAlert("Detalle eliminado correctamente");
                    fetchRutaDetails(rutaId);
                } else {
                    showAlert(result.message, "danger");
                }
            })
            .catch(error => showAlert("Error al eliminar detalle: " + error.message, "danger"));
    }
}

// Botón para volver al listado de rutas
document.getElementById('btnVolver').addEventListener('click', function () {
    window.location.href = "index.html";
});

// Al cargar la página, obtener el ID de la ruta de la query string y cargar sus detalles
const routeId = getQueryParam('id');
if (routeId) {
    fetchRutaDetails(routeId);
} else {
    document.getElementById('rutaInfo').innerHTML = '<p>ID de ruta no proporcionado.</p>';
}

document.addEventListener('DOMContentLoaded', () => {
    Components.init(); // carga header y footer
});