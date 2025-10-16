import mongoose from "mongoose";
import personalInfoModel from "../../models/personalInfoModel.js";
import userModel from "../../models/signupModel.js";

async function customerDetails(page = 1, limit = 10) {
	const data = {};

	try {
		const total = await personalInfoModel.countDocuments();
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
			.find()
			.populate({ path: "userId", select: "isBlocked role email -_id", match: { role: "user" } })
			// .populate({ path: "address", select: "state city country houseName pin street -_id" })
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
		data.newCustomers = await countUsersBetweenDates("2025-10-16", "2025-10-16");
		data.data = filteredInfos.map((info) => ({
			id: info._id,
			name: `${info.fname} ${info.lname}`,
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

		const data = {
			id: personalInfo._id,
			name: `${personalInfo.fname} ${personalInfo.lname}`,
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
			
		};

		return data;
	} catch (error) {
		console.error("Error fetching customer details:", error);
		return { error: "Failed to fetch customer details" };
	}
};

export { customerDetails, singleCustomer };
