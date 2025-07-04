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
    Components.init(); // carga header y footer
    fetchRutas();  // carga inicial de vehículos
});