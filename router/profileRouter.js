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
    .get("/enrollment", profileController.getOrderPage)
    .get("/shedules", profileController.getShedulePage)

    .post("/addService", profileController.addService)
    .post("/editService", profileController.editOrder)
    .post("/editOrder", profileController.editService)
    .post('/gallery/upload', upload.single('photo'), profileController.uploadPhotoForGallery.bind(profileController))
    .delete('/deleteService/:id', profileController.deleteService)
    .delete('/gallery/delete/:galleryId', profileController.deleteGallery )

    .get("/addSchedule", profileController.getSchedulePage)
    // .post("/addSchedule", profileController.addSchedule)
    // .delete('/deleteSchedule/:id', profileController.deleteSchedule)

    .get("/addSchedule", profileController.getSchedulePage)
    ;

module.exports = profileRouter;