import {
	addCategory,
	category,
	editCategory,
	getCategoryAddPage,
	getCategoryEditPage,
	removeCategory,
} from "../controllers/admin/categoryContoller.js";

import {
	getCustomers,
	getSingleCustomer,
	updateCustomerBlockStatus,
} from "../controllers/admin/customerController.js";

import { dashboard } from "../controllers/admin/dashboardContoller.js";
import { Router } from "express";
import upload from "../middleware/multerMiddleware.js";

const admin = Router();

admin.get("/", dashboard);
admin.get("/categories", category);
admin.get("/customers", getCustomers);

admin
	.route("/categories/action")
	.get(getCategoryAddPage)
	.post(upload.single("categoryImage"), addCategory);

admin
	.route("/categories/action/:id")
	.get(getCategoryEditPage)
	.patch(upload.single("categoryImage"), editCategory)
	.delete(removeCategory);

admin.route("/customers/:id").get(getSingleCustomer).patch(updateCustomerBlockStatus);

export default admin;
