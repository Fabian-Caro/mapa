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

const controller = require('./VehicleController');

// Agrega el endpoint de búsqueda antes de la ruta dinámica
// router.get('/search', searchVehiculo);

// Rutas para vehículos
router.get('/', controller.getAll);
router.get('/:placa', controller.getByPlate);
router.post('/', controller.create);
// router.put('/:placa', updateVehiculo);
router.delete('/:plate', controller.deleteVehicle);

module.exports = router;
