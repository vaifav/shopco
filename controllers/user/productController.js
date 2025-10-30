import { getProductData, getSingleProduct } from "../../services/productService.js";

const products = async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 5;
	const search = req.query.search;
	const category = req.query.category;
	const size = req.query.size;
	const price = parseInt(req.query.price) || -1;
	const minprice = parseInt(req.query.minprice);
	const maxprice = parseInt(req.query.maxprice);

	try {
		const data = await getProductData(page, limit, search, category, size, price, minprice, maxprice);
		return res.render("user/product", data);
	} catch (error) {
		console.error("Error rendering product page:", error.message);
		return res.status(500).render("user/pagenotfound", { error });
	}
};

const singleProduct = async (req, res) => {
	try {
		const data = await getSingleProduct(req.params.id,req.params.varId);

		return res.render("user/singleProduct",data);
	} catch (error) {
		console.error("Error rendering product page:", error.message);
		return res.status(500).render("user/pagenotfound", { error });
	}
};

export { products, singleProduct };
