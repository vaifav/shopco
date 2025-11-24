import {
	createCoupon,
	deleteCoupon,
	getCouponEditDetails,
	getCoupons,
	getProductAndCategoryDetails,
	updateCoupon,
} from "../../services/admin/couponService.js";
import mongoose from "mongoose";

const getCouponPage = async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 5;

	try {
		const data = await getCoupons(page, limit);
		return res.render("admin/adminCoupons", data);
	} catch (error) {
		throw new Error(error.message);
	}
};

const getCouponAddPage = async (req, res) => {
	try {
		const data = await getProductAndCategoryDetails();
		return res.render("admin/adminCouponsAdd", data);
	} catch (error) {
		throw new Error(error.message);
	}
};

const getCouponEditPage = async (req, res) => {
	try {
		const data = await getCouponEditDetails(req.params.couponId);
		return res.render("admin/adminCouponsEdit", data);
	} catch (error) {
		throw new Error(error.message);
	}
};

const addCoupon = async (req, res) => {
	try {
		console.log(req.body);
		const couponData = req.body;

		if (
			!couponData.code ||
			!couponData.discountType ||
			!couponData.startDate ||
			!couponData.expiryDate
		) {
			throw new Error("Missing required coupon fields.");
		}
		await createCoupon(couponData);
		return res.redirect(
			`/admin/coupons/add?success=${encodeURIComponent("Coupon created Successfully")}`
		);
	} catch (error) {
		console.log(error.message);
		return res.redirect(`/admin/coupons/add?error=${encodeURIComponent(error.message.toString())}`);
	}
};

const editCoupon = async (req, res) => {
	try {
		const couponId = req.params.couponId;
		const updateData = req.body;
		if (!mongoose.Types.ObjectId.isValid(couponId)) {
			return res.status(400).json({
				success: false,
				message: "Invalid coupon ID format.",
			});
		}

		const updatedCoupon = await updateCoupon(couponId, updateData);

		return res.status(200).json({
			success: true,
			message: `Coupon '${updatedCoupon.code}' updated successfully.`,
			coupon: updatedCoupon,
		});
	} catch (error) {
		console.error("Error in editCoupon controller:", error.message);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

const removeCoupon = async (req, res) => {
	try {
		const { couponId } = req.params;
		const deletedCoupon = await deleteCoupon(couponId);

		return res.status(200).json({
			success: true,
			message: `Coupon ${deletedCoupon.code} successfully Removed.`,
			isDeleted: deletedCoupon.isDeleted,
		});
	} catch (error) {
		console.log("Error archiving coupon:", error.message);
		return res.status(400).json({
			success: false,
			message: error.message || "Failed to archive coupon due to a server error.",
		});
	}
};
export { getCouponPage, getCouponAddPage, getCouponEditPage, addCoupon, editCoupon, removeCoupon };
