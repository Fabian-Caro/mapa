const express = require('express');
const router = express.Router();
// const {
//     getAllVehiculos,
//     getVehiculoByPlaca,
//     createVehiculo,
//     updateVehiculo,
//     deleteVehiculo,
//     searchVehiculo  // Importa la función de búsqueda
// } = require('../../../controller/vehiculosController');

const controller = require('./vehicleController');

// Agrega el endpoint de búsqueda antes de la ruta dinámica
// router.get('/search', searchVehiculo);

// Rutas para vehículos
router.get('/', controller.getAllVehicles);
// router.get('/:placa', getVehiculoByPlaca);
router.post('/', controller.createVehicle);
// router.put('/:placa', updateVehiculo);
// router.delete('/:placa', deleteVehiculo);

module.exports = router;
