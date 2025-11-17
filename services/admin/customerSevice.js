import mongoose from "mongoose";
import personalInfoModel from "../../models/personalInfoModel.js";
import userModel from "../../models/signupModel.js";
import OrderModel from "../../models/orderModel.js";

async function customerDetails(page = 1, limit = 5, createdAt, fname, search = "", isBlocked = "") {
	const data = {};
	const query = {};
	const sortCriteria = {};

	const sortOption = { createdAt, fname };
	const activeSortEntry = Object.entries(sortOption).find(([field, order]) => order !== null);
	if (activeSortEntry) {
		const [field, order] = activeSortEntry;
		sortCriteria[field] = order;
	} else {
		sortCriteria["createdAt"] = -1;
	}

	if (search && search.trim() !== "") {
		const regex = new RegExp("^" + search, "i");
		query.$or = [{ fname: { $regex: regex } }, { phone: { $regex: regex } }];
	}
	if (isBlocked === true || isBlocked === false) {
		query.isBlocked = isBlocked;
	}

	try {
		const total = await personalInfoModel.countDocuments(query);
		const totalPages = Math.ceil(total / limit);
		if (page < 1) page = 1;
		if (page > totalPages) page = totalPages || 1;
		let skip = (page - 1) * limit;

		async function countUsersBetweenDates(fromDate, toDate) {
			const start = new Date(fromDate);
			start.setHours(0, 0, 0, 0);

			const end = new Date(toDate);
			end.setHours(23, 59, 59, 999);

			const count = await personalInfoModel.countDocuments({
				createdAt: { $gte: start, $lte: end },
			});

			return count;
		}

		const personalInfos = await personalInfoModel
			.find(query)
			.populate({ path: "userId", select: "isBlocked role email -_id", match: { role: "user" } })
			.sort(sortCriteria)
			.skip(skip)
			.limit(limit)
			.lean();

		const filteredInfos = personalInfos.filter((info) => info.userId !== null);

		data.total = total;
		data.page = page;
		data.limit = limit;
		data.totalPages = totalPages;
		data.totalCustomers = await personalInfoModel.countDocuments();
		data.visitors = await userModel.countDocuments({ isVisitor: true });
		data.blockedUser = await userModel.countDocuments({ isBlocked: true, role: "user" });
		data.activeUser = await userModel.countDocuments({ isBlocked: false, role: "user" });
		data.newCustomers = await countUsersBetweenDates("2025-10-16", "2025-10-16");
		data.data = filteredInfos.map((info) => ({
			id: info._id,
			name: `${info.fname} ${info.lname || ""}`,
			email: info.email,
			phone: info.phone,
			isBlocked: info?.userId?.isBlocked || false,
			role: info.userId.role,
		}));

		return data;
	} catch (error) {
		console.error("Error fetching customer details:", error);
		return { data: [], error: "Failed to fetch customer details" };
	}
}

const singleCustomer = async (userId) => {
	try {
		const personalInfo = await personalInfoModel
			.findOne({ _id: new mongoose.Types.ObjectId(userId.trim()) })
			.populate({
				path: "userId",
				select: "isBlocked role email -_id",
				match: { role: "user" },
			})
			.populate({
				path: "address",
				select: "state city country houseName pin street -_id",
			})
			.lean();
		const userIdForOrder = await personalInfoModel.findOne({ _id: userId });
		const orders = await OrderModel.find({
			user: new mongoose.Types.ObjectId(userIdForOrder.userId),
		});

		const data = {
			id: personalInfo._id,
			name: `${personalInfo.fname} ${personalInfo.lname || ""}`,
			email: personalInfo.email,
			phone: personalInfo.phone,
			isBlocked: personalInfo.userId.isBlocked || false,
			role: personalInfo.userId.role,
			gender: personalInfo.gender,
			avatar: personalInfo.avatar,
			address: {
				state: personalInfo.address.state,
				city: personalInfo.address.city,
				country: personalInfo.address.country,
				houseName: personalInfo.address.houseName,
				pin: personalInfo.address.pin,
				street: personalInfo.address.street,
			},
			orders,
		};

		console.log(data.orders);

		return data;
	} catch (error) {
		console.error("Error fetching customer details:", error);
		return { error: "Failed to fetch customer details" };
	}
};

const blockOrUnblockCustomer = async (id, { isBlocked }) => {
	try {
		if (typeof isBlocked !== "boolean") throw new Error("Only Boolean is allowed");

		const personalInfo = await personalInfoModel.findOne({ _id: id });
		const userId = personalInfo.userId;
		const updateUserModel = await userModel.findOneAndUpdate(
			{ _id: userId },
			{ $set: { isBlocked } }
		);
		const updateInfoModel = await personalInfoModel.findOneAndUpdate(
			{ _id: id },
			{ $set: { isBlocked } }
		);

		const db = mongoose.connection.db;
		const sessionCollection = db.collection("sessions");
		if (isBlocked) {
			const result = await sessionCollection.deleteMany({
				session: new RegExp(`"userId":"${personalInfo.userId.toString()}"`),
			});
		}

		if (!updateUserModel || !updateInfoModel) throw new Error("Customer not found or update failed");
		const user = await userModel.findOne({ _id: userId });
		return { isBlocked: user.isBlocked, personalInfo };
	} catch (error) {
		console.error("Error ", error);
		return { error: "Failed to update" };
	}
};

export { customerDetails, singleCustomer, blockOrUnblockCustomer };
