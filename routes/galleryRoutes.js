const router = require('express').Router();
const galleryController = require('../controller/galleryController');
const authMiddleware  = require('../middleware/routesAuth');

router.post('/addGallery',authMiddleware, galleryController.createGallery);
router.get('/getAllGallery', galleryController.getAllGalleries);
router.get('/getGalleryById/:id', galleryController.getGalleryById);
router.delete('/deleteGallery/:id',authMiddleware, galleryController.deleteGalleryById);
router.put('/updateGallery/:id',authMiddleware, galleryController.updateGalleryById);

module.exports = router;
