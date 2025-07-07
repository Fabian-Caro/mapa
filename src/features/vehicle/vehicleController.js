const VehicleModel = require('./VehicleModel');

// Obtener todos los vehículos
function getAll(req, res) {
    try {
        const vehiculos = VehicleModel.getAll();
        res.json({ success: true, data: vehiculos });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener los vehículos" });
    }
}

// Obtener vehículo por placa
function getByPlate(req, res) {
    try {
        const vehiculos = VehicleModel.getAll();
        const vehiculo = vehiculos.find(vehicle => vehicle.plate.toUpperCase() === req.params.plate.toUpperCase());

        if (!vehiculo) {
            return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
        }
        res.json({ success: true, data: vehiculo });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener el vehículo" });
    }
}

// Crear nuevo vehículo
function create(req, res) {
    try {
        const { plate, modelo, color, marca, capacidadCarga } = req.body;

        // Validar datos requeridos
        if (!plate || !modelo || !marca) {
            return res.status(400).json({
                success: false,
                message: "Placa, modelo y marca son requeridos"
            });
        }

        // Verificar si ya existe un vehículo con esa placa
        const vehiculos = VehicleModel.getAll();
        const existe = vehiculos.some(vehicle => vehicle.plate === plate);

        if (existe) {
            return res.status(400).json({
                success: false,
                message: "Ya existe un vehículo con esa placa"
            });
        }

        // Crear nuevo vehículo
        const newVehiculo = VehicleModel.create(
            plate,
            modelo,
            color,
            marca,
            capacidadCarga
        );

        vehiculos.push(newVehiculo);

        if (VehicleModel.save(vehiculos)) {
            res.status(201).json({
                success: true,
                message: "Vehículo creado exitosamente",
                data: newVehiculo
            });
        } else {
            throw new Error("Error al guardar el vehículo");
        }
    } catch (error) {
        console.error("Error al crear el vehículo:", error);
        res.status(500).json({
            success: false,
            message: "Error al crear el vehículo",
            error: error.message
        });
    }
}

// Actualizar vehículo
function update(req, res) {
    try {
        const { plate } = req.params;
        const updateData = req.body;

        const vehiculos = VehicleModel.getAll();
        const index = vehiculos.findIndex(vehicle => vehicle.plate === plate);

        if (index === -1) {
            return res.status(404).json({ success: false, message: "Vehículo no encontrado" });
        }

        // Actualizar solo los campos proporcionados
        vehiculos[index] = {
            ...vehiculos[index],
            ...updateData,
            plate // Mantener la placa original
        };

        if (VehicleModel.save(vehiculos)) {
            res.json({ success: true, data: vehiculos[index] });
        } else {
            throw new Error("Error al guardar los cambios");
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al actualizar el vehículo" });
    }
}

// Eliminar vehículo
function deleteVehicle(req, res) {
    try {
        const { plate } = req.params;
        const vehiculos = VehicleModel.getAll();
        const newVehiculos = vehiculos.filter(vehicle => vehicle.plate.toUpperCase() !== plate.toUpperCase());

        if (newVehiculos.length === vehiculos.length) {
            return res.status(404).json({ success: false, message: 'Vehículo no encontrado, fallamos acá' });
        }

        if (VehicleModel.save(newVehiculos)) {
            res.json({ success: true, message: 'Vehículo eliminado correctamente' });
        } else {
            throw new Error("Error al eliminar el vehículo");
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al eliminar el vehículo" });
    }
}

function searchVehiculo(req, res) {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ success: false, message: "No se proporcionó el término de búsqueda" });
        }

        const vehiculos = vehiculosModel.getVehiculos();
        const lowerQuery = query.toLowerCase();

        // Filtrar vehículos que contengan el término en la placa, marca o modelo (sin distinguir mayúsculas)
        const filtered = vehiculos.filter(vehiculo =>
            vehiculo.placa.toLowerCase().includes(lowerQuery) ||
            vehiculo.marca.toLowerCase().includes(lowerQuery) ||
            vehiculo.modelo.toLowerCase().includes(lowerQuery)
        );

        if (filtered.length > 0) {
            res.json({ success: true, data: filtered });
        } else {
            res.json({ success: false, message: "No se encontraron vehículos" });
        }
    } catch (error) {
        console.error("Error al buscar vehículos:", error);
        res.status(500).json({ success: false, message: "Error al buscar vehículos", error: error.message });
    }
}

module.exports = {
    getAll,
    getByPlate,
    create,
    update,
    deleteVehicle,
    searchVehiculo
};