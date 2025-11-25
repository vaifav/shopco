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
	getRefCodeForUser,
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
	createRazorpayOrder,
	verifyRazorpayPaymentAndPlaceOrder,
	placeWalletOrder,
	removeCoupon,
	applyCoupon,
} from "../controllers/user/checkoutContoller.js";
import initializeCheckout from "../middleware/checkoutMiddleware.js";
import {
	cancelOrder,
	getOrderDetailPage,
	getOrdersPage,
	getOrderSuccessPage,
	cancelItem,
	returnItem,
} from "../controllers/user/orderController.js";
import { downloadOrderInvoice } from "../controllers/admin/orderController.js";
import {
	addToWishlist,
	getWishListPage,
	removeCompleteWishList,
	removeFromWishlist,
} from "../controllers/user/wishlistController.js";
import { getWalletPage } from "../controllers/user/walletController.js";

const user = Router();

const authVerified = [requireAuth, isVerified];
const checkoutMiddleware = [requireAuth, isVerified, initializeCheckout];

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

user.post("/order/place", ...authVerified, placeOrder);
user.post("/order/place/wallet", ...authVerified, placeWalletOrder);
user.post("/checkout/razorpay/order", ...authVerified, initializeCheckout, createRazorpayOrder);
user.post(
	"/checkout/razorpay/verify",
	...authVerified,
	initializeCheckout,
	verifyRazorpayPaymentAndPlaceOrder
);

user.get("/order/success", ...authVerified, getOrderSuccessPage);
user.get("/myorders/:orderId", ...authVerified, getOrderDetailPage);
user.patch("/order/cancel/:orderId", ...authVerified, cancelOrder);
user.get("/orders/invoice/:orderId", downloadOrderInvoice);
user.patch("/order/item/cancel/:orderId/:itemId", ...authVerified, cancelItem);
user.patch("/order/item/return/:orderId/:itemId", ...authVerified, returnItem);

user.get("/wishlist", ...authVerified, getWishListPage);
user.post("/wishlist", ...authVerified, addToWishlist);
user.delete("/wishlist/:id", ...authVerified, removeFromWishlist);
user.delete("/wishlist", ...authVerified, removeCompleteWishList);

user.get("/mywallet", ...authVerified, getWalletPage);
user.post("/checkout/removeCoupon", ...authVerified, removeCoupon);
user.post("/checkout/applyCoupon", ...authVerified, applyCoupon);

user.get("/refcode", getRefCodeForUser);
export default user;
