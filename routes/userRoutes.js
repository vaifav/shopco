import { Router } from "express";
import home from "../controllers/user/homeController.js";
import {
	addAddress,
	editAddress,
	getAddressPage,
	removeAddress,
} from "../controllers/user/addressController.js";
import {
	addPersonalInfo,
	editPersonlInfo,
	getPersonalInfoPage,
} from "../controllers/user/personalInfoController.js";
import { upload } from "../middleware/multerMiddleware.js";
import {
	products,
	singleProduct,
	singleProductByColor,
} from "../controllers/user/productController.js";
import { baseAuth, isVerified, requireAuth } from "../middleware/authMiddleware.js";
import {
	addToCart,
	clearAllItems,
	getCartPage,
	removeItemFromCart,
	updateCartItemQuantity,
} from "../controllers/user/cartContoller.js";
import {
	buyNowAndStartCheckout,
	getCheckOutAddressPage,
	getCheckOutPage,
	getCheckoutPaymentPage,
	getCheckoutSummaryPage,
	placeOrder,
	savePaymentMethodAndRedirect,
	saveShippingAddressSnapshot,
	startCartCheckout,
} from "../controllers/user/checkoutContoller.js";
import initializeCheckout from "../middleware/checkoutMiddleware.js";
import {
	cancelOrder,
	getOrderDetailPage,
	getOrdersPage,
	getOrderSuccessPage,
} from "../controllers/user/orderController.js";
import { downloadOrderInvoice } from "../controllers/admin/orderController.js";
import { getWishListPage } from "../controllers/user/wishlistController.js";

const user = Router();

user.get("/username", (req, res) => {
	if (req.session?.user?.isVerified) {
		return res.json({ username: req.session?.user?.username });
	}
	return res.json({});
});

user.get("/", baseAuth, home);
user.get("/products", baseAuth, products);
user.get("/products/:id/:varId", baseAuth, singleProduct);
user.get("/products/:id/:varId/:color", baseAuth, singleProductByColor);

user
	.route("/cart")
	.get(baseAuth, getCartPage)
	.post(baseAuth, addToCart)
	.put(baseAuth, updateCartItemQuantity)
	.delete(baseAuth, removeItemFromCart);

user.delete("/cart/all", clearAllItems);

const authVerified = [requireAuth, isVerified];

user.get("/account", ...authVerified, getPersonalInfoPage);
user.get("/address", ...authVerified, getAddressPage);
user.get("/myorders", ...authVerified, getOrdersPage);

user
	.route("/personalinfo/")
	.post(...authVerified, upload.single("profile"), addPersonalInfo)
	.patch(...authVerified, upload.single("profile"), editPersonlInfo);

user.route("/address").post(...authVerified, addAddress);

user
	.route("/address/:id")
	.patch(...authVerified, editAddress)
	.delete(...authVerified, removeAddress);

const checkoutMiddleware = [requireAuth, isVerified, initializeCheckout];

user
	.route("/checkout")
	.get(...checkoutMiddleware, getCheckOutPage)
	.post(...checkoutMiddleware, startCartCheckout);

user.post("/checkout/buy-now", ...checkoutMiddleware, buyNowAndStartCheckout);

user
	.route("/checkout/address")
	.get(...checkoutMiddleware, getCheckOutAddressPage)
	.post(...checkoutMiddleware, saveShippingAddressSnapshot);

user
	.route("/checkout/payment")
	.get(...checkoutMiddleware, getCheckoutPaymentPage)
	.post(...checkoutMiddleware, savePaymentMethodAndRedirect);

user.get("/checkout/summary", ...checkoutMiddleware, getCheckoutSummaryPage);
user.post("/order/place", requireAuth, isVerified, placeOrder);
user.get("/order/success", requireAuth, isVerified, getOrderSuccessPage);

user.get("/myorders/:orderId", requireAuth, isVerified, getOrderDetailPage);
user.patch("/order/cancel/:orderId", requireAuth, isVerified, cancelOrder);
user.get("/orders/invoice/:orderId", downloadOrderInvoice);

user.get("/wishlist", ...authVerified, getWishListPage);

export default user;
