const router = require("express").Router();
const { submitContactForm } = require("../controllers/emailController");

router.post("/sendMail", submitContactForm);

module.exports = router;
