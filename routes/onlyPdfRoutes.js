const router = require("express").Router();
const onlyPdfController = require("../controller/onlyPDFController")
const { uploadPDF } = require("../controller/onlyPDFController")

router.post("/create", uploadPDF.single("pdf"), onlyPdfController.createEventWithPdfAndTitle)
router.get("/getall", onlyPdfController.getAllEventWithPdfAndTitle)
router.delete("/delete/:id", onlyPdfController.deleteEventWithPdfAndTitle)
router.put("/update/:id", uploadPDF.single("pdf"), onlyPdfController.editEventWithPdfandTitle);

module.exports = router;