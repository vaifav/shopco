const getWishListPage = async (req, res) => {
	try {
		return res.render("user/wishlist");
	} catch (error) {
		console.log(error);
		return;
	}
};
export { getWishListPage };
