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

// Función para validar el formulario de vehículo
function validateForm(formData) {
    const plate = formData.get('plate');
    const brand = formData.get('brand');
    const model = formData.get('model');
    const color = formData.get('color');
    // La capacidad de carga es opcional en este ejemplo.
    if (!plate || plate.trim() === '') return false;
    if (!brand || brand.trim() === '') return false;
    if (!model || model.trim() === '') return false;
    if (!color || color.trim() === '') return false;
    return true;
}

// Función para obtener y mostrar todos los vehículos
function fetchVehicles() {
    fetch('/api/vehicle')
        .then(response => {
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            return response.json();
        })
        .then(result => {
            if (result.success) {
                renderVehicles(result.data);
            } else {
                throw new Error('Error en la respuesta de la API');
            }
        })
        .catch(error => showAlert('Error al cargar los vehículos: ' + error.message, 'error'));
}

// Función para renderizar las tarjetas de vehículos
function renderVehicles(vehicles) {
    const container = document.getElementById('vehiculosContainer');
    container.innerHTML = '';
    vehicles.forEach(vehicle => {
        const card = `
          <div class="col-md-4">
            <div class="card mb-4">
              <div class="card-body">
                <h5 class="card-title"><i class="fas fa-truck"></i> ${vehicle.brand} ${vehicle.model}</h5>
                <p class="card-text"><strong>Placa:</strong> ${vehicle.plate}</p>
                <p class="card-text"><strong>Color:</strong> ${vehicle.color}</p>
                <p class="card-text"><strong>Capacidad de Carga:</strong> ${vehicle.loadCapacity || 'N/D'}</p>
                <div class="btn-group">
                  <button class="btn btn-outline-info" onclick="showDetailsVehicle('${vehicle.plate}')"><i class="fas fa-info-circle"></i> Detalles</button>
                  <button class="btn btn-outline-warning" onclick="editVehicle('${vehicle.plate}')"><i class="fas fa-edit"></i> Editar</button>
                  <button class="btn btn-outline-danger" onclick="deleteVehicle('${vehicle.plate}')"><i class="fas fa-trash"></i> Eliminar</button>
                </div>
              </div>
            </div>
          </div>`;
        container.innerHTML += card;
    });
}

// Envío del formulario: crear o actualizar vehículo
document.getElementById('vehiculoForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const form = e.target;
    form.classList.add('was-validated');

    const formData = new FormData(form);
    if (!validateForm(formData)) return;

    const vehicleData = {
        plate: formData.get('plate'),
        brand: formData.get('brand'),
        model: formData.get('model'),
        color: formData.get('color'),
        loadCapacity: formData.get('loadCapacity')
    };

    // Determinar si se está editando o creando
    const isEditing = form.getAttribute('data-editing') === 'true';
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/vehicle/${vehicleData.plate}` : '/api/vehicle';
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(vehicleData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error || 'Error inesperado');
            showAlert(isEditing ? 'Vehículo actualizado correctamente' : 'Vehículo creado exitosamente', 'success');
            fetchVehicles();
            const modal = bootstrap.Modal.getInstance(document.getElementById('vehiculoModal'));
            modal.hide();
            form.reset();
            form.classList.remove('was-validated');
            form.removeAttribute('data-editing');
            document.getElementById('modalTitle').textContent = 'Agregar Nuevo Vehículo';
        })
        .catch(error => showAlert(error.message || 'Error al procesar la solicitud', 'error'));
});

// Función para editar: carga datos en el formulario y activa modo edición
function editVehicle(plate) {
    fetch(`/api/vehicle/${plate}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const vehicle = result.data;
                document.querySelector('[name="plate"]').value = vehicle.plate;
                document.querySelector('[name="brand"]').value = vehicle.brand;
                document.querySelector('[name="model"]').value = vehicle.model;
                document.querySelector('[name="color"]').value = vehicle.color;
                document.querySelector('[name="loadCapacity"]').value = vehicle.loadCapacity;
                document.getElementById('modalTitle').textContent = 'Editar Vehículo';
                document.getElementById('vehiculoForm').setAttribute('data-editing', 'true');
                new bootstrap.Modal(document.getElementById('vehiculoModal')).show();
            } else {
                showAlert(result.message, 'danger');
            }
        })
        .catch(error => showAlert('Error al cargar el vehículo: ' + error.message, 'error'));
}

// Función para eliminar vehículo
function deleteVehicle(plate) {
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
            fetch(`/api/vehicle/${plate}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (response.ok) {
                        showAlert('Vehículo eliminado correctamente', 'success');
                        fetchVehicles();
                    } else {
                        showAlert('Error al eliminar el vehículo', 'error');
                    }
                })
                .catch(error => showAlert('Error al eliminar el vehículo', 'error'));
        }
    })
}

// Función para mostrar detalles del vehículo
function showDetailsVehicle(plate) {
    fetch(`/api/vehicle/${plate}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const vehicle = result.data;
                const detailsBody = document.getElementById('vehiculoDetailsBody');
                detailsBody.innerHTML = `
              <div class="row">
                <div class="col-md-6">
                  <h4><i class="fas fa-truck"></i> ${vehicle.brand} ${vehicle.model}</h4>
                  <p><strong><i class="fas fa-id-card"></i> Placa:</strong> ${vehicle.plate}</p>
                  <p><strong><i class="fas fa-palette"></i> Color:</strong> ${vehicle.color}</p>
                  <p><strong><i class="fas fa-truck-loading"></i> Capacidad de Carga:</strong> ${vehicle.loadCapacity || 'N/D'}</p>
                </div>
              </div>`;
                new bootstrap.Modal(document.getElementById('detailsModal')).show();
            } else {
                showAlert(result.message, 'danger');
            }
        })
        .catch(error => showAlert('Error al cargar los detalles del vehículo: ' + error.message, 'error'));
}

// Buscador unificado: filtra por placa, marca o modelo
document.getElementById('searchInput').addEventListener('input', function (e) {
    const searchTerm = e.target.value.trim();
    if (searchTerm.length === 0) {
        fetchVehicles();
        return;
    }
    // Se asume que en el backend existe un endpoint de búsqueda que acepte el parámetro "query"
    fetch(`/api/vehicle/search?query=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                renderVehicles(result.data);
            } else {
                showAlert(result.message, 'danger');
                document.getElementById('vehiculosContainer').innerHTML = '';
            }
        })
        .catch(error => showAlert('Error en la búsqueda: ' + error.message, 'error'));
});

// Al cerrar el modal, limpiar el formulario y resetear modo edición
document.getElementById('vehiculoModal').addEventListener('hidden.bs.modal', function () {
    const form = document.getElementById('vehiculoForm');
    form.reset();
    form.classList.remove('was-validated');
    form.removeAttribute('data-editing');
    document.getElementById('modalTitle').textContent = 'Agregar Nuevo Vehículo';
});

document.addEventListener('DOMContentLoaded', () => {
    Components.init(); // carga header y footer
    fetchVehicles();  // carga inicial de vehículos
});
