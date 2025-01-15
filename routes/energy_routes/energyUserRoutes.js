const router = require("express").Router();
const EnergyUserController = require("../../controller/energy_Controller/userEnergyController")

router.post("/register", EnergyUserController.registerEnergy);

module.exports = router;