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
	unblockProduct,
} from "../controllers/admin/productContoller.js";
import { isVerified } from "../middleware/authMiddleware.js";
import {
	getAdminOrders,
	getAdminOrderDetailPage,
	updateAdminOrderItemStatus,
	downloadOrderInvoice,
} from "../controllers/admin/orderController.js";
import {
	addCoupon,
	editCoupon,
	getCouponAddPage,
	getCouponEditPage,
	getCouponPage,
	removeCoupon,
} from "../controllers/admin/couponController.js";

const admin = Router();

admin.get("/", dashboard);
admin.get("/categories", category);
admin.get("/customers", getCustomers);
admin.get("/products", productListPage);
admin.get("/orders", getAdminOrders);
admin.get("/orders/:orderId", getAdminOrderDetailPage);
admin.patch("/orders/:orderId/items/:itemId/status", updateAdminOrderItemStatus);

admin.route("/products/action").get(getProductAdd).post(uploadMultipleVariantImages, addProduct);

admin.get("/products/action/:id", getProductEdit);
admin.patch("/products/action/:id", uploadMultipleVariantImages, editProduct);
admin.put("/products/action/:id", unblockProduct);
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
admin.get("/orders/invoice/:orderId", downloadOrderInvoice);

admin.get("/coupons", getCouponPage);
admin.get("/coupons/add", getCouponAddPage);
admin.post("/coupons", addCoupon);
admin.delete("/coupons/:couponId", removeCoupon);
admin.get("/coupons/:couponId", getCouponEditPage);
admin.patch("/coupons/:couponId", editCoupon);

admin.use((req, res) => res.status(404).render("user/pagenotfound"));
export default admin;
