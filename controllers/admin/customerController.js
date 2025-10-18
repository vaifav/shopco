import { Country } from "country-state-city";
import {
	blockOrUnblockCustomer,
	customerDetails,
	singleCustomer,
} from "../../services/admin/customerSevice.js";

const countries = Country.getAllCountries();

async function getCustomers(req, res) {
	let page = parseInt(req.query.page) || 1;
	let limit = parseInt(req.query.limit) || 5;
	let createdAt = parseInt(req.query.createdAt) || -1;
	let search = req.query.search;
	let isBlocked = "";
	if (req.query.isBlocked) {
		isBlocked = req.query.isBlocked === "true" ? true : false;
	}

	const data = await customerDetails(page, limit, createdAt, search, isBlocked);
	res.render("admin/adminCustomers", {
		customers: data.data,
		totalCustomers: data.totalCustomers,
		visitors: data.visitors,
		newCustomers: data.newCustomers,
		blockedUser: data.blockedUser,
		activeUser: data.activeUser,
		page: data.page,
		totalPages: data.totalPages,
		limit: data.limit,
		total: data.total,
	});
}

const getSingleCustomer = async (req, res) => {
	try {
		const data = await singleCustomer(req.params.id);
		return res.render("admin/adminSingleCustomer", { data, countries });
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

const updateCustomerBlockStatus = async (req, res) => {
	try {
		const { isBlocked } = await blockOrUnblockCustomer(req.params.id, req.body);
		return res.status(201).json({
			success: true,
			message: isBlocked ? "Block customer" : "Unblock customer",
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			message: `${error.message}`,
		});
	}
};

export { getCustomers, getSingleCustomer, updateCustomerBlockStatus };
