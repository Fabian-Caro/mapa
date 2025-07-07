function createCard(ruta) {
    return `
        <div class="col-md-4">
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title"><i class="fas fa-route"></i> Ruta ${ruta.id}</h5>
              <p class="card-text"><i class="fas fa-user"></i> <strong>Conductor:</strong> ${ruta.conductor}</p>
              <p class="card-text"><i class="fas fa-truck"></i> <strong>Vehículo:</strong> ${ruta.vehiculo}</p>
              <p class="card-text"><i class="fas fa-calendar-alt"></i> <strong>Fecha:</strong> ${ruta.fecha}</p>
              <div class="btn-group">
                <button class="btn btn-outline-info" onclick="redirectToDetalleRuta('${ruta.id}')"><i class="fas fa-info-circle"></i> Detalles y Mapa</button>
                <button class="btn btn-outline-warning" onclick="editRuta('${ruta.id}')"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn btn-outline-danger" onclick="deleteRuta('${ruta.id}')"><i class="fas fa-trash"></i> Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      `;
}
// Función para mostrar alertas
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

// Validar formulario de ruta
function validateRutaForm(formData) {
    const id = formData.get('id');
    const conductor = formData.get('conductor');
    const vehiculo = formData.get('vehiculo');
    const fecha = formData.get('fecha');
    if (!id || id.trim() === '') return false;
    if (!conductor || conductor.trim() === '') return false;
    if (!vehiculo || vehiculo.trim() === '') return false;
    if (!fecha || fecha.trim() === '') return false;
    return true;
}

// Obtener todas las rutas
function fetchRutas() {
    fetch('/api/rutas')
        .then(response => {
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            return response.json();
        })
        .then(result => {
            if (result.success) {
                renderRutas(result.data);
            } else {
                throw new Error('Error en la respuesta de la API');
            }
        })
        .catch(error => showAlert('Error al cargar las rutas: ' + error.message, 'error'));
}

// Renderizar el listado de rutas
function renderRutas(rutas) {
    const container = document.getElementById('rutasContainer');
    container.innerHTML = '';
    rutas.forEach(ruta => {
        const card = createCard(ruta);
        container.innerHTML += card;
    });
}

// Función para redirigir a detalleruta.html
function redirectToDetalleRuta(id) {
    window.location.href = "detalleruta.html?id=" + encodeURIComponent(id);
}

// Envío del formulario: crear o actualizar ruta
document.getElementById('rutaForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const form = e.target;
    form.classList.add('was-validated');

    const formData = new FormData(form);
    if (!validateRutaForm(formData)) return;

    const rutaData = {
        id: formData.get('id'),
        conductor: formData.get('conductor'),
        vehiculo: formData.get('vehiculo'),
        fecha: formData.get('fecha')
    };

    const isEditing = form.getAttribute('data-editing') === 'true';
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/rutas/${rutaData.id}` : '/api/rutas';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(rutaData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            showAlert(isEditing ? 'Ruta actualizada correctamente' : 'Ruta creada exitosamente', 'success');
            fetchRutas();
            const modal = bootstrap.Modal.getInstance(document.getElementById('rutaModal'));
            modal.hide();
            form.reset();
            form.classList.remove('was-validated');
            form.removeAttribute('data-editing');
            document.getElementById('modalTitle').textContent = 'Agregar Nueva Ruta';
        })
        .catch(error => showAlert(error.message || 'Error al procesar la solicitud', 'error'));
});

// Función para editar: cargar datos en el formulario
function editRuta(id) {
    fetch(`/api/rutas/${id}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const ruta = result.data;
                document.querySelector('[name="id"]').value = ruta.id;
                document.querySelector('[name="conductor"]').value = ruta.conductor;
                document.querySelector('[name="vehiculo"]').value = ruta.vehiculo;
                document.querySelector('[name="fecha"]').value = ruta.fecha;
                document.getElementById('modalTitle').textContent = 'Editar Ruta';
                document.getElementById('rutaForm').setAttribute('data-editing', 'true');
                new bootstrap.Modal(document.getElementById('rutaModal')).show();
            } else {
                showAlert(result.message, 'danger');
            }
        })
        .catch(error => showAlert('Error al cargar la ruta: ' + error.message, 'error'));
}

// Función para eliminar una ruta
function deleteRuta(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "¡No podrás revertir esto!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminarlo!',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/rutas/${id}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (response.ok) {
                        showAlert('Ruta eliminada correctamente', 'success');
                        fetchRutas();
                    } else {
                        showAlert('Error al eliminar la ruta', 'error');
                    }
                })
                .catch(error => showAlert('Error al eliminar la ruta', 'error'));
        }
    });
}

// Buscador unificado: filtra por conductor, vehículo, fecha o ID
document.getElementById('searchInput').addEventListener('input', function (e) {
    const searchTerm = e.target.value.trim();
    if (searchTerm.length === 0) {
        fetchRutas();
        return;
    }

    // Asume que hay un endpoint de búsqueda que maneja los parámetros
    const queryString = `?query=${encodeURIComponent(searchTerm)}`;
    fetch(`/api/rutas/search${queryString}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                renderRutas(result.data);
            } else {
                showAlert(result.message, 'danger');
                document.getElementById('rutasContainer').innerHTML = '';
            }
        })
        .catch(error => showAlert('Error en la búsqueda: ' + error.message, 'error'));
});

// Al cerrar el modal, limpiar el formulario y resetear modo edición
document.getElementById('rutaModal').addEventListener('hidden.bs.modal', function () {
    const form = document.getElementById('rutaForm');
    form.reset();
    form.classList.remove('was-validated');
    form.removeAttribute('data-editing');
    document.getElementById('modalTitle').textContent = 'Agregar Nueva Ruta';
});

document.addEventListener('DOMContentLoaded', () => {
    //const conductorSelect = document.getElementById('conductorSelect');
    const vehiculoSelect = document.getElementById('vehiculoSelect');
    const rutaModal = document.getElementById('rutaModal');

    // --- Funciones para interactuar con tu API REST ---

    // Función para obtener todos los vehículos del backend
    async function getAllVehiculosAPI() {
        try {
            const response = await fetch('/api/vehiculos'); // Tu ruta de API para vehículos
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const result = await response.json();
            if (result.success) {
                return result.data; // Devuelve solo el array de vehículos
            } else {
                throw new Error('Error en la respuesta de la API de vehículos');
            }
        } catch (error) {
            console.error('Error al obtener vehículos de la API:', error);
            // Puedes mostrar un mensaje al usuario aquí, por ejemplo:
            showAlert('No se pudieron cargar los vehículos: ' + error.message, 'error');
            return []; // Retorna un array vacío para evitar errores posteriores
        }
    }

    // Función para obtener todos los conductores del backend
    async function getAllConductoresAPI() {
        try {
            // Asumiendo una estructura similar a la de vehículos para conductores
            const response = await fetch('/api/conductores'); // Tu ruta de API para conductores
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const result = await response.json();
            if (result.success) {
                return result.data; // Devuelve solo el array de conductores
            } else {
                throw new Error('Error en la respuesta de la API de conductores');
            }
        } catch (error) {
            console.error('Error al obtener conductores de la API:', error);
            // Puedes mostrar un mensaje al usuario aquí
            return [];
        }
    }

    // Función para obtener todas las rutas del backend
    async function getAllRutasAPI() {
        try {
            const response = await fetch('/api/rutas'); // Tu ruta de API para vehículos
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const result = await response.json();
            if (result.success) {
                return result.data; // Devuelve solo el array de vehículos
            } else {
                throw new Error('Error en la respuesta de la API de rutas');
            }
        } catch (error) {
            console.error('Error al obtener rutas de la API:', error);
            // Puedes mostrar un mensaje al usuario aquí, por ejemplo:
            showAlert('No se pudieron cargar las rutas: ' + error.message, 'error');
            return []; // Retorna un array vacío para evitar errores posteriores
        }
    }

    // --- Funciones para poblar los selectores ---

    async function cargarConductoresEnSelector() {
        // Limpiar opciones existentes (excepto la primera "Seleccione...")
        conductorSelect.innerHTML = '<option value="" disabled selected>Seleccione un conductor</option>';
        try {
            const conductores = await getAllConductoresAPI();
            conductores.forEach(conductor => {
                const option = document.createElement('option');
                // Asumiendo que tus conductores tienen un 'id' y un 'nombre'
                option.value = `${conductor.nombres} ${conductor.apellidos}`; // Usa un ID único si lo tienes, o el nombre
                option.textContent = `${conductor.nombres} ${conductor.apellidos}`; // Muestra el nombre
                conductorSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar los conductores en el selector:', error);
        }
    }

    async function cargarVehiculosEnSelector() {
        // Limpiar opciones existentes (excepto la primera "Seleccione...")
        vehiculoSelect.innerHTML = '<option value="" disabled selected>Seleccione un vehículo</option>';
        try {
            const vehiculos = await getAllVehiculosAPI();
            vehiculos.forEach(vehiculo => {
                const option = document.createElement('option');
                // Usaremos la placa como valor único para el vehículo
                option.value = vehiculo.placa;
                option.textContent = `${vehiculo.placa} (${vehiculo.marca} ${vehiculo.modelo})`;
                vehiculoSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar los vehículos en el selector:', error);
        }
    }

    async function cargarIdRutas() {
        // Limpiar opciones existentes (excepto la primera "Seleccione...")
        const inputId = document.querySelector('input[name="id"]');
        try {
            const rutas = await getAllRutasAPI();
            const idRuta = rutas.length+1;
            if (inputId) {
                    inputId.value = idRuta;
                } else {
                    console.error("No se encontró el input con name='id'.");
                }
        } catch (error) {
            console.error('Error al cargar los conductores en el selector:', error);
        }
    }

    // --- Event Listener para cuando el modal se muestra ---

    rutaModal.addEventListener('show.bs.modal', () => {
        cargarConductoresEnSelector();
        cargarVehiculosEnSelector();
        cargarIdRutas();
    });

    // --- Validación del formulario (mantenemos la lógica de Bootstrap) ---

    const rutaForm = document.getElementById('rutaForm');
    rutaForm.addEventListener('submit', event => {
        if (!rutaForm.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        rutaForm.classList.add('was-validated');
    }, false);

    Components.init(); // carga header y footer
    fetchRutas();  // carga inicial de vehículos
});