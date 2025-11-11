import { createCart, cartDetails, deleteCartItem } from "../../services/cartService.js";

const getCartPage = async (req, res) => {
	const userId = req?.session?.user?.userId;
	try {
		const cart = userId ? await cartDetails(req, userId) : await cartDetails(req, null);
		return res.render("user/cart", { cart });
	} catch (error) {
		console.log(error);
	}
};

const addToCart = async (req, res) => {
	const body = req.body;
	const userId = req?.session?.user?.userId;
	try {
		if (userId) {
			const cart = await createCart(req, res, userId, body);
			return res.json({
				success: true,
				message: "Item Added to cart....",
			});
		} else {
			const cart = await createCart(req, res, null, body);
			return res.json({
				success: true,
				message: "Item Added to cart....",
			});
		}
	} catch (error) {
		console.log(error);
		return res.json({
			success: false,
			message: error.message,
		});
	}
};

const removeItemFromCart = async (req, res) => {
	const body = req.body;
	console.log(body);

	const userId = req?.session?.user?.userId;
	try {
		if (userId) {
			const cart = await deleteCartItem(req, userId, body.variantId, body.size);
			return res.json({
				success: true,
				message: "Item removed from cart....",
			});
		} else {
			const cart = await deleteCartItem(req, null, body.variantId, body.size);
			return res.json({
				success: true,
				message: "Item removed from cart....",
			});
		}
	} catch (error) {
		console.log(error);
		return res.json({
			success: false,
			message: error.message,
		});
	}
};

export { getCartPage, addToCart, removeItemFromCart };
