const router = require("express").Router();
const onSiteRegisterRoute = require("../controller/onSiteRegisterController")

router.post("/create", onSiteRegisterRoute.createOnSiteRegister)
router.get("/getall", onSiteRegisterRoute.getAllOnSiteRegister)
router.delete("/delete/:id", onSiteRegisterRoute.deleteOnSiteRegister)
router.put("/update/:id", onSiteRegisterRoute.updateOnSiteRegister);
router.post("/markAttendanceForOnSiteUser", onSiteRegisterRoute.markAttendanceForOnSiteUser);

module.exports = router;