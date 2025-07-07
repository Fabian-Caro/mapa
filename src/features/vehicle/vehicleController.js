const VehicleModel = require('./vehicleModel');

// Obtener todos los vehículos
function getAll(req, res) {
    try {
        const vehicles = VehicleModel.getAll();
        res.json({ success: true, data: vehicles });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener los vehículos" });
    }
}

// Obtener vehículo por placa
function getByPlate(req, res) {
    try {
        const vehicles = VehicleModel.getAll();
        const vehicle = vehicles.find(vehicle => vehicle.plate.toUpperCase() === req.params.plate.toUpperCase());

        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
        }
        res.json({ success: true, data: vehicle });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener el vehículo" });
    }
}

// Crear nuevo vehículo
function create(req, res) {
    try {
        const { plate, brand, model, color, loadCapacity } = req.body;

        // Validar datos requeridos
        if (!plate || !brand || !model) {
            return res.status(400).json({
                success: false,
                message: "Placa, modelo y marca son requeridos"
            });
        }

        // Verificar si ya existe un vehículo con esa placa
        const vehicles = VehicleModel.getAll();
        const exists = vehicles.some(vehicle => vehicle.plate === plate);

        if (exists) {
            return res.status(400).json({
                success: false,
                message: "Ya existe un vehículo con esa placa"
            });
        }

        // Crear nuevo vehículo
        const newVehicle = VehicleModel.create(
            plate,
            brand,
            model,
            color,
            loadCapacity
        );

        vehicles.push(newVehicle);

        if (VehicleModel.save(vehicles)) {
            res.status(201).json({
                success: true,
                message: "Vehículo creado exitosamente",
                data: newVehicle
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

        const vehicles = VehicleModel.getAll();
        const index = vehicles.findIndex(vehicle => vehicle.plate === plate);

        if (index === -1) {
            return res.status(404).json({ success: false, message: "Vehículo no encontrado" });
        }

        // Actualizar solo los campos proporcionados
        vehicles[index] = {
            ...vehicles[index],
            ...updateData,
            plate // Mantener la placa original
        };

        if (VehicleModel.save(vehicles)) {
            res.json({ success: true, data: vehicles[index] });
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
        const vehicles = VehicleModel.getAll();
        const newVehicles = vehicles.filter(vehicle => vehicle.plate.toUpperCase() !== plate.toUpperCase());

        if (newVehicles.length === vehicles.length) {
            return res.status(404).json({ success: false, message: 'Vehículo no encontrado, fallamos acá' });
        }

        if (VehicleModel.save(newVehicles)) {
            res.json({ success: true, message: 'Vehículo eliminado correctamente' });
        } else {
            throw new Error("Error al eliminar el vehículo");
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al eliminar el vehículo" });
    }
}

function search(req, res) {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ success: false, message: "No se proporcionó el término de búsqueda" });
        }

        const vehicles = VehicleModel.getAll();
        const lowerQuery = query.toLowerCase();

        // Filtrar vehículos que contengan el término en la placa, marca o modelo (sin distinguir mayúsculas)
        const filtered = vehicles.filter(vehicle =>
            vehicle.plate.toLowerCase().includes(lowerQuery) ||
            vehicle.brand.toLowerCase().includes(lowerQuery) ||
            vehicle.model.toLowerCase().includes(lowerQuery)
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

function getCount(req, res) {
    try {
        const vehicles = VehicleModel.getAll();
        res.json({ success: true, count: vehicles.length });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener el conteo de vehículos"});
    }
}

module.exports = {
    getAll,
    getByPlate,
    create,
    update,
    deleteVehicle,
    search,
    getCount
};