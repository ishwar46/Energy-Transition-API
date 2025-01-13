const router = require("express").Router();
const siteSceneController = require("../controller/siteController");

router.post("/create", siteSceneController.createSite);
router.get("/get/:id", siteSceneController.getSite);
router.get("/getall", siteSceneController.getAllSite);
router.delete("/delete/:id", siteSceneController.deleteSite);

module.exports = router;
