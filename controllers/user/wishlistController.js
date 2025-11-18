import {
	createWishlistItem,
	deleteCompleteWishList,
	deleteWishlistItem,
	getWishListData,
} from "../../services/wishlistService.js";

const getWishListPage = async (req, res) => {
	const userId = req.session?.user?.userId;
	try {
		const wishlist = await getWishListData(userId);
		return res.render("user/wishlist", { wishlist });
	} catch (error) {
		console.log(error);
		return;
	}
};

const addToWishlist = async (req, res) => {
	const userId = req?.session?.user?.userId;
	const { variantId } = req.body;

	try {
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Please log in to add items to your wishlist.",
			});
		}

		const wishlist = await createWishlistItem(userId, variantId);
		return res.status(200).json({ success: true, message: "Item added to wishlist." });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: "Failed to add item." });
	}
};

const removeFromWishlist = async (req, res) => {
	const userId = req.session.user.userId;
	const variantId = req.params.id;

	try {
		const wishlist = await deleteWishlistItem(userId, variantId);
		if (!wishlist) {
			return res.status(404).json({ success: false, message: "Wishlist not found." });
		}
		return res.status(200).json({ success: true, message: "Item removed from wishlist." });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: "Failed to remove item." });
	}
};

const removeCompleteWishList = async (req, res) => {
	const userId = req.session.user.userId;
	try {
		const wishlist = await deleteCompleteWishList(userId);
		if (!wishlist) {
			return res.status(404).json({ success: false, message: "Wishlist not found." });
		}
		return res.status(200).json({ success: true, message: "Complete items removed from wishlist." });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: "Failed to remove item." });
	}
};

export { getWishListPage, addToWishlist, removeFromWishlist, removeCompleteWishList };
