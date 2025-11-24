import { getWalletDetails } from "../../services/walletService.js";

const getWalletPage = async (req, res) => {
	const userId = req.session.user.userId;
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 5;

	console.log(req.query);

	try {
		const walletData = await getWalletDetails(userId, page, limit);

		return res.render("user/wallet", {
			personalInfo: {},
			wallet: {
				balance: walletData.balance,
				transactions: walletData.transactions,
			},
			page: walletData.page,
			limit: walletData.limit,
			totalPages: walletData.totalPages,
		});
	} catch (error) {
		console.error("Error loading wallet page:", error);
		throw new Error(error.message);
	}
};

export { getWalletPage };
