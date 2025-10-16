import { getCustomers, getSingleCustomer } from "../controllers/admin/customerController.js";
import { dashboard } from "../controllers/admin/dashboardContoller.js";
import { Router } from "express";

const admin = Router();

admin.get("/", dashboard);
admin.get("/customers", getCustomers);
admin.get("/customers/:userId", getSingleCustomer);

admin.get("/product/add", (req, res) => {
	res.render("admin/adminAddProducts");
});

export default admin;
