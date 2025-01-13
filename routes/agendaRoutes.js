const router = require("express").Router();
const authMiddleware = require("../middleware/routesAuth");
const AgendaController = require("../controller/agendaController");

router.post("/createAgenda", authMiddleware, AgendaController.createAgenda);
router.get("/getallAgenda", AgendaController.getAllAgenda);
router.get("/getOneAgenda", AgendaController.getOneAgenda);
router.post("/submitAnswer", AgendaController.submitAnswer);

module.exports = router;