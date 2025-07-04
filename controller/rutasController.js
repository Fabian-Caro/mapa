// controller/rutasController.js
const rutasModel = require('../models/rutasModel');

// Obtener todas las rutas (se devuelve un objeto con success y data)
function getAllRutas(req, res) {
    try {
        const rutas = rutasModel.getRutas();
        res.json({ success: true, data: rutas });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener las rutas", error: error.message });
    }
}

// Obtener ruta por ID
function getRutaById(req, res) {
    try {
        const rutas = rutasModel.getRutas();
        // Se compara como cadena para evitar problemas de tipos
        const ruta = rutas.find(r => String(r.id) === String(req.params.id));
        if (!ruta) {
            return res.status(404).json({ success: false, message: 'Ruta no encontrada' });
        }
        res.json({ success: true, data: ruta });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener la ruta", error: error.message });
    }
}

// Crear nueva ruta (se evita usar "new Ruta" y se asegura que tenga "detalles")
function createRuta(req, res) {
    try {
        const rutaData = req.body;
        // Validar campos requeridos
        if (!rutaData.conductor || !rutaData.vehiculo || !rutaData.fecha) {
            return res.status(400).json({ success: false, message: "Datos de la ruta inválidos o incompletos" });
        }

        const rutas = rutasModel.getRutas();

        // Crear objeto ruta (se asigna un ID y se asegura que tenga "detalles")
        const newRuta = {
            id: rutas.length > 0 ? Math.max(...rutas.map(r => parseInt(r.id))) + 1 : 1,
            conductor: rutaData.conductor,
            vehiculo: rutaData.vehiculo,
            fecha: rutaData.fecha,
            detalles: rutaData.detalles || []  // Puede enviarse desde el front o quedar vacío
        };

        rutas.push(newRuta);
        rutasModel.saveRutas(rutas);
        res.status(201).json({ success: true, message: "Ruta creada exitosamente", data: newRuta });
    } catch (error) {
        console.error("Error al crear la ruta:", error);
        res.status(500).json({ success: false, message: "Error al crear la ruta", error: error.message });
    }
}

// Actualizar ruta (se preserva la propiedad "detalles" si existe)
function updateRuta(req, res) {
    try {
        const rutas = rutasModel.getRutas();
        // Convertir a número si es necesario
        const rutaIndex = rutas.findIndex(r => String(r.id) === String(req.params.id));
        if (rutaIndex === -1) {
            return res.status(404).json({ success: false, message: "Ruta no encontrada" });
        }

        const updateData = req.body;
        const currentRuta = rutas[rutaIndex];

        rutas[rutaIndex] = {
            ...currentRuta,
            conductor: updateData.conductor || currentRuta.conductor,
            vehiculo: updateData.vehiculo || currentRuta.vehiculo,
            fecha: updateData.fecha || currentRuta.fecha,
            // Si se envían detalles en update, se reemplazan; de lo contrario, se preservan
            detalles: updateData.detalles || currentRuta.detalles || []
        };

        rutasModel.saveRutas(rutas);
        res.json({ success: true, data: rutas[rutaIndex] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al actualizar la ruta", error: error.message });
    }
}

// Eliminar ruta
function deleteRuta(req, res) {
    try {
        const rutas = rutasModel.getRutas();
        const newRutas = rutas.filter(r => String(r.id) !== String(req.params.id));
        if (newRutas.length === rutas.length) {
            return res.status(404).json({ success: false, message: 'Ruta no encontrada' });
        }
        rutasModel.saveRutas(newRutas);
        res.json({ success: true, message: 'Ruta eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al eliminar la ruta", error: error.message });
    }
}

// Buscar rutas (por conductor, vehículo, fecha, e incluso por ID si se desea)
function searchRutas(req, res) {
    try {
        const rutas = rutasModel.getRutas();
        let resultados = rutas;

        // Filtrar por cada campo si se proporciona
        if (req.query.conductor) {
            resultados = resultados.filter(r => r.conductor.toLowerCase().includes(req.query.conductor.toLowerCase()));
        }
        if (req.query.vehiculo) {
            resultados = resultados.filter(r => r.vehiculo.toLowerCase().includes(req.query.vehiculo.toLowerCase()));
        }
        if (req.query.fecha) {
            resultados = resultados.filter(r => r.fecha === req.query.fecha);
        }
        // También se puede buscar por ID (opcional)
        if (req.query.id) {
            resultados = resultados.filter(r => String(r.id) === String(req.query.id));
        }

        res.json({ success: true, data: resultados });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error en la búsqueda de rutas", error: error.message });
    }
}

module.exports = {
    getAllRutas,
    getRutaById,
    createRuta,
    updateRuta,
    deleteRuta,
    searchRutas
};
