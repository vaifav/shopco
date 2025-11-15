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
import { upload, uploadMultipleVariantImages } from "../middleware/multerMiddleware.js";
import {
	addProduct,
	editProduct,
	getProductAdd,
	getProductEdit,
	productListPage,
	softDeleteProduct,
} from "../controllers/admin/productContoller.js";
import { isVerified } from "../middleware/authMiddleware.js";
import { getAdminOrders ,getAdminOrderDetailPage, updateAdminOrderStatus} from "../controllers/admin/orderController.js";

const admin = Router();

admin.get("/", dashboard);
admin.get("/categories", category);
admin.get("/customers", getCustomers);
admin.get("/products", productListPage);
admin.get("/orders", getAdminOrders);
admin.get("/orders/:orderId", getAdminOrderDetailPage);
admin.put('/orders/:orderId/status', updateAdminOrderStatus);

admin.route("/products/action").get(getProductAdd).post(uploadMultipleVariantImages, addProduct);

admin.get("/products/action/:id", getProductEdit);
admin.patch("/products/action/:id", uploadMultipleVariantImages, editProduct);
admin.delete("/products/action/:id", softDeleteProduct);

admin.use(isVerified);
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

admin.use((req, res) => res.status(404).render("user/pagenotfound"));
export default admin;
