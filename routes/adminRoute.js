import {
	getCustomers,
	getSingleCustomer,
	updateCustomerBlockStatus,
} from "../controllers/admin/customerController.js";
import { dashboard } from "../controllers/admin/dashboardContoller.js";
import { Router } from "express";

const admin = Router();

admin.get("/", dashboard);
admin.get("/customers", getCustomers);
admin.get("/customers/:id", getSingleCustomer);
admin.patch("/customers/:id", updateCustomerBlockStatus);

export default admin;
