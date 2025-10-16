import { getCustomers, getSingleCustomer } from "../controllers/admin/customerController.js";
import { dashboard } from "../controllers/admin/dashboardContoller.js";
import { noCache, toLogin } from "../middleware/loginMiddleware.js";
import { Router } from "express";

const admin = Router();

admin.use(noCache);
admin.use(toLogin);
admin.get("/", dashboard);
admin.get("/customers", getCustomers);
admin.get("/customers/:userId", getSingleCustomer);

export default admin;
