import mongoose from "mongoose";
import categoryModel from "../../models/categoryModel.js";
import couponModel from "../../models/couponModel.js";
import productModel from "../../models/productModel.js";

const processRestrictionList = (commaSeparatedIds) => {
	if (!commaSeparatedIds) return [];

	return commaSeparatedIds
		.split(",")
		.filter((id) => id.trim() !== "")
		.map((id) => {
			try {
				return new mongoose.Types.ObjectId(id.trim());
			} catch (error) {
				console.warn(`Invalid ObjectId encountered: ${id}`);
				return null;
			}
		})
		.filter((id) => id !== null);
};

const validateCouponCreation = async (data) => {
	const {
		code,
		discountValue,
		discountType,
		maxDiscountAmount,
		minPurchaseAmount,
		maxGlobalUses,
		maxUsesPerUser,
		startDate,
		expiryDate,
		restrictionScope,
		productRestrictionList,
		categoryRestrictionList,
	} = data;

	if (code) {
		const codePattern = code ? new RegExp(`^${code.trim()}$`, "i") : "";
		const existingCoupon = await couponModel.findOne({ code: codePattern });
		if (existingCoupon) {
			throw new Error("Coupon code already exists. Please choose a different code.");
		}
	}

	if (isNaN(discountValue) || discountValue <= 0) {
		throw new Error("Discount Value must be a positive number.");
	}
	if (discountType === "percentage" && discountValue > 100) {
		throw new Error("Percentage discount cannot exceed 100 percent.");
	}

	if (maxDiscountAmount !== null && maxDiscountAmount !== Infinity) {
		if (isNaN(maxDiscountAmount) || maxDiscountAmount < 0) {
			throw new Error("Max Discount Cap must be zero or a positive number.");
		}
	}

	if (isNaN(minPurchaseAmount) || minPurchaseAmount < 0) {
		throw new Error("Minimum Purchase Amount must be zero or a positive number.");
	}
	if (isNaN(maxGlobalUses) || maxGlobalUses < 0) {
		if (maxGlobalUses !== Infinity) {
			throw new Error("Max Global Uses must be zero or a positive number.");
		}
	}
	if (isNaN(maxUsesPerUser) || maxUsesPerUser < 1) {
		throw new Error("Max Uses Per User must be 1 or greater.");
	}

	const start = new Date(startDate);
	const expiry = new Date(expiryDate);

	if (isNaN(start.getTime()) || isNaN(expiry.getTime())) {
		throw new Error("Invalid Start Date or Expiry Date.");
	}
	if (expiry <= start) {
		throw new Error("Expiry Date must be after the Start Date.");
	}

	if (restrictionScope.includes("Products") && productRestrictionList.length === 0) {
		throw new Error("Restriction scope requires products, but the list is empty.");
	}
	if (restrictionScope.includes("Categories") && categoryRestrictionList.length === 0) {
		throw new Error("Restriction scope requires categories, but the list is empty.");
	}
};

const validateCouponUpdate = async (data, currentCouponId) => {
	const {
		code,
		discountValue,
		discountType,
		maxDiscountAmount,
		minPurchaseAmount,
		maxGlobalUses,
		maxUsesPerUser,
		startDate,
		expiryDate,
		restrictionScope,
		productRestrictionList,
		categoryRestrictionList,
		isActive,
	} = data;

	if (code) {
		const codePattern = code ? new RegExp(`^${code.trim()}$`, "i") : "";
		const existingCoupon = await couponModel.findOne({
			$and: [{ code: codePattern }, { _id: { $ne: new mongoose.Types.ObjectId(currentCouponId) } }],
		});

		if (existingCoupon) {
			throw new Error("Coupon code already exists on another coupon.");
		}
	}

	if (isActive === true) {
		const coupon = await couponModel.findOne({ _id: currentCouponId }, { isDeleted: 1 });
		if (coupon && coupon.isDeleted === true) {
			throw new Error("Cannot activate a deleted coupon.");
		}
	}

	if (isNaN(discountValue) || discountValue <= 0) {
		throw new Error("Discount Value must be a positive number.");
	}
	if (discountType === "percentage" && discountValue > 100) {
		throw new Error("Percentage discount cannot exceed 100 percent.");
	}

	if (maxDiscountAmount !== null && maxDiscountAmount !== Infinity) {
		if (isNaN(maxDiscountAmount) || maxDiscountAmount < 0) {
			throw new Error("Max Discount Cap must be zero or a positive number.");
		}
	}

	if (isNaN(minPurchaseAmount) || minPurchaseAmount < 0) {
		throw new Error("Minimum Purchase Amount must be zero or a positive number.");
	}
	if (isNaN(maxGlobalUses) || maxGlobalUses < 0) {
		if (maxGlobalUses !== Infinity) {
			throw new Error("Max Global Uses must be zero or a positive number.");
		}
	}
	if (isNaN(maxUsesPerUser) || maxUsesPerUser < 1) {
		throw new Error("Max Uses Per User must be 1 or greater.");
	}

	const start = new Date(startDate);
	const expiry = new Date(expiryDate);

	if (isNaN(start.getTime()) || isNaN(expiry.getTime())) {
		throw new Error("Invalid Start Date or Expiry Date.");
	}
	if (expiry <= start) {
		throw new Error("Expiry Date must be after the Start Date.");
	}

	if (restrictionScope.includes("Products") && productRestrictionList.length === 0) {
		throw new Error("Restriction scope requires products, but the list is empty.");
	}
	if (restrictionScope.includes("Categories") && categoryRestrictionList.length === 0) {
		throw new Error("Restriction scope requires categories, but the list is empty.");
	}
};

const getCoupons = async (page = 1, limit = 5, search = "", isActive = "") => {
	const data = {};
	const query = { isDeleted: false };
	try {
		const total = await couponModel.countDocuments(query);
		const totalPages = Math.ceil(total / limit);
		if (page < 1) page = 1;
		if (page > totalPages) page = totalPages || 1;
		let skip = (page - 1) * limit;

		const coupons = await couponModel.find(query).skip(skip).limit(limit);

		data.page = page;
		data.limit = limit;
		data.totalPages = totalPages;
		data.coupons = coupons;

		return data;
	} catch (error) {
		throw new Error(error.message);
	}
};

const getProductAndCategoryDetails = async () => {
	try {
		const data = {};
		const products = await productModel.find({ isBlocked: false }, { _id: 1, productName: 1 });
		const categories = await categoryModel.find({ isBlocked: false }, { _id: 1, categoryName: 1 });

		data.products = products;
		data.categories = categories;

		return data;
	} catch (error) {
		throw new Error(error.message);
	}
};

const getCouponEditDetails = async (couponId) => {
	try {
		if (!couponId) throw new Error("Coupon not found.....");
		const coupon = await couponModel.findOne({ _id: couponId });
		if (!coupon) throw new Error("Coupon not found.");

		const data = await getProductAndCategoryDetails();
		data.coupon = coupon;

		return data;
	} catch (error) {
		throw new Error(error.message);
	}
};

const createCoupon = async (data) => {
	try {
		const parsedData = {
			...data,
			discountValue: parseFloat(data.discountValue),
			maxDiscountAmount: data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : null,
			maxGlobalUses: data.maxGlobalUses ? parseInt(data.maxGlobalUses) : Infinity,
			maxUsesPerUser: parseInt(data.maxUsesPerUser),
			minPurchaseAmount: parseFloat(data.minPurchaseAmount),
			startDate: new Date(data.startDate),
			expiryDate: new Date(data.expiryDate),
			isActive: data.isActive === "true",
			productRestrictionList: data.productRestrictionList || "",
			categoryRestrictionList: data.categoryRestrictionList || "",
		};

		await validateCouponCreation(parsedData);

		const productRestrictions = processRestrictionList(parsedData.productRestrictionList);
		const categoryRestrictions = processRestrictionList(parsedData.categoryRestrictionList);

		const newCouponData = {
			...parsedData,
			productRestrictionList: productRestrictions,
			categoryRestrictionList: categoryRestrictions,
		};

		const newCoupon = await couponModel.create(newCouponData);
		return newCoupon;
	} catch (error) {
		throw new Error(error.message);
	}
};

const updateCoupon = async (couponId, updateData) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(couponId)) {
			throw new Error("Invalid coupon ID format.");
		}

		const parsedData = {
			...updateData,
			productRestrictionList: updateData.productRestrictionList || [],
			categoryRestrictionList: updateData.categoryRestrictionList || [],
		};

		await validateCouponUpdate(parsedData, couponId);

		const productRestrictions = processRestrictionList(updateData.productRestrictionList);
		const categoryRestrictions = processRestrictionList(updateData.categoryRestrictionList);

		const finalUpdateData = {
			...updateData,
			productRestrictionList: productRestrictions,
			categoryRestrictionList: categoryRestrictions,
		};
		console.log(finalUpdateData);
		
		const updatedCoupon = await couponModel.findByIdAndUpdate(couponId, finalUpdateData, {
			new: true,
			runValidators: true,
		});

		if (!updatedCoupon) {
			throw new Error("Coupon not found.");
		}

		return updatedCoupon;
	} catch (error) {
		throw new Error(error.message);
	}
};

const deleteCoupon = async (couponId) => {
	try {
		if (!couponId) {
			throw new Error("Coupon ID is required for archival.");
		}

		const deletedCoupon = await couponModel.findByIdAndUpdate(
			couponId,
			{
				isDeleted: true,
				isActive: false,
				deletedAt: new Date(),
			},
			{ new: true }
		);

		if (!deletedCoupon) {
			throw new Error("Coupon not found......");
		}

		return deletedCoupon;
	} catch (error) {
		throw new Error(error.message);
	}
};

export {
	getCoupons,
	getCouponEditDetails,
	getProductAndCategoryDetails,
	createCoupon,
	updateCoupon,
	deleteCoupon,
};
