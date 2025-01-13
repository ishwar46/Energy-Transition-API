const router = require("express").Router();
const eventWithPdfController = require("../controller/eventWithPdfController")
const { uploadEvent } = require("../controller/eventWithPdfController")

router.post("/create", uploadEvent.single("pdf"), eventWithPdfController.createEventWithPdf)
router.get("/getall", eventWithPdfController.getAllEventWithPdf)
router.delete("/delete/:id", eventWithPdfController.deleteEventWithPdf)
router.put("/update/:id", uploadEvent.single("pdf"), eventWithPdfController.editEventWithPdf)

module.exports = router;