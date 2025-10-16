import { Country } from "country-state-city";
import { customerDetails, singleCustomer } from "../../services/admin/customerSevice.js";

const countries = Country.getAllCountries()

async function getCustomers(req, res) {
	let page = parseInt(req.query.page) || 1;
	let limit = parseInt(req.query.limit) || 10;

	const data = await customerDetails(page, limit);
	res.render("admin/adminCustomers", {
		customers: data.data,
		totalCustomers: data.totalCustomers,
		visitors: data.visitors,
		newCustomers: data.newCustomers,
		page: data.page,
		totalPages: data.totalPages,
		limit: data.limit,
		total: data.total,
	});
}

const getSingleCustomer = async (req, res) => {
	try {
		const data = await singleCustomer(req.params.userId);
		return res.render("admin/adminSingleCustomer", { data , countries});
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

export { getCustomers, getSingleCustomer };
