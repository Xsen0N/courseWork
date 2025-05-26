const Router = require("express");
const profileRouter = new Router();
const profileController = require("../controllers/profileController");
const upload = require('./upload');

profileRouter
    .get("/", profileController.getPage)
    .post('/upload-photo', upload.single('photo'), profileController.uploadPhoto.bind(profileController))
    .post("/editProfile", profileController.editProfile)
    .get("/services", profileController.getServicesPage)
    .get("/orders", profileController.getServicesPage)
    .get('/getService/:serviceId', profileController.getService)
    .get("/gallery", profileController.getGallery)
    .post("/enrollment/action", profileController.editOrder)
    .put("/changeService/:id/status", profileController.resubmitService)
    .get("/enrollment", profileController.getOrderPage)
    .get("/shedules", profileController.getShedulePage)
    .post("/addService", profileController.addService)
    .post("/addCriteria", profileController.addCriteria)
    .post("/editService", profileController.editService)
    .post("/editOrder", profileController.editOrder)
    .post('/gallery/upload', upload.single('photo'), profileController.uploadPhotoForGallery.bind(profileController))
    .delete('/deleteService/:id', profileController.deleteService)
    .delete('/gallery/delete/:galleryId', profileController.deleteGallery );

module.exports = profileRouter;