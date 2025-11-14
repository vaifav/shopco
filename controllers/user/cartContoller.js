import {
	createCart,
	cartDetails,
	deleteCartItem,
	updateCartItemCount,
	clearUserCart,
	mergeGuestCartIfPresent,
} from "../../services/cartService.js";

const getCartPage = async (req, res) => {
	const userId = req?.session?.user?.userId;

	if (userId && req.cookies?.guestId) {
		try {
			await mergeGuestCartIfPresent(req, res, userId);
		} catch (error) {
			console.error("Merge failed on cart page load:", error);
		}
	}

	try {
		const cart = userId ? await cartDetails(req, userId) : await cartDetails(req, null);
		return res.render("user/cart", { cart });
	} catch (error) {
		console.log(error);

		return res.render("user/cart", { cart: [] });
	}
};

const addToCart = async (req, res) => {
	const body = req.body;
	const userId = req?.session?.user?.userId;
	try {
		if (userId) {
			if (req.cookies?.guestId) {
				await mergeGuestCartIfPresent(req, res, userId);
			}

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
		return res.status(400).json({
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
			if (req.cookies?.guestId) {
				await mergeGuestCartIfPresent(req, res, userId);
			}

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
		return res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

const updateCartItemQuantity = async (req, res) => {
	const { variantId, size, count } = req.body;
	const userId = req?.session?.user?.userId;

	if (!variantId || !size || typeof count === "undefined") {
		return res
			.status(400)
			.json({ success: false, message: "Missing required item details or count." });
	}

	const newCount = parseInt(count, 10);

	if (isNaN(newCount)) {
		return res.status(400).json({ success: false, message: "Invalid quantity value." });
	}

	try {
		if (userId && req.cookies?.guestId) {
			await mergeGuestCartIfPresent(req, res, userId);
		}

		await updateCartItemCount(req, userId, variantId, size, newCount);

		return res.json({
			success: true,
			message: "Item quantity updated successfully.",
			newCount: newCount,
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

const clearAllItems = async (req, res) => {
	const userId = req?.session?.user?.userId;

	try {
		if (userId && req.cookies?.guestId) {
			await mergeGuestCartIfPresent(req, res, userId);
		}

		await clearUserCart(req, userId);

		return res.json({
			success: true,
			message: "All items have been removed from your cart.",
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

export { getCartPage, addToCart, removeItemFromCart, updateCartItemQuantity, clearAllItems };
