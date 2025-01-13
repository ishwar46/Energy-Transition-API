const router = require("express").Router();
const venueController = require("../controller/venueController");

router.post("/create", venueController.createVenue);
router.get("/getall", venueController.getAllVenue);
router.delete("/delete/:id", venueController.deleteVenueById);
router.put("/update/:id", venueController.updateVenueById);

module.exports = router;
