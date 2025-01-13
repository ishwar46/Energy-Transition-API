const express = require("express");
const {
  allocateParticipant,
  deallocateParticipant,
  createBus,
  getBuses,
  deleteBus,
} = require("../controller/busController");
const authMiddleware = require("../middleware/routesAuth");
const router = express.Router();

router.post("/createbus", authMiddleware, createBus);
router.get("/getallbus", getBuses);
router.post("/allocate", authMiddleware, allocateParticipant);
router.delete("/deallocate", authMiddleware, deallocateParticipant);
router.delete("/deletebus/:busId", authMiddleware, deleteBus);

module.exports = router;
