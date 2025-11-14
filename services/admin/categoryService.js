import mongoose from "mongoose";
import categoryModel from "../../models/categoryModel.js";

const getParentCategories = async () => {
	try {
		const category = await categoryModel.find(
			{ parentCategory: null, isBlocked: false },
			{ _id: 1, categoryName: 1 }
		);
		return category;
	} catch (error) {
		console.log(error.message);
		throw new Error(error.message);
	}
};

const getCategoryInfo = async (_id) => {
	try {
		const category = await categoryModel.findOne({ _id, isBlocked: false });
		if (!category) throw new Error("Category Not Found");

		return category;
	} catch (error) {
		console.log(error.message);
		throw new Error(error.message);
	}
};

const createCategory = async (data, createdBy) => {
	const categoryNamePattern = new RegExp(`^${data.categoryName.trim()}$`, "i");
	try {
		const categoryNameExists = await categoryModel.findOne({
			categoryName: categoryNamePattern,
		});
		if (categoryNameExists) throw new Error(`${data.categoryName} category exists`);

		const category = await categoryModel.create({ ...data, createdBy });
		return category;
	} catch (error) {
		console.log(error.message);
		throw new Error(error.message);
	}
};

const updateCategory = async (data, categoryId, updatedBy) => {
	const categoryNamePattern = new RegExp(`^${data.categoryName.trim()}$`, "i");
	try {
		const categoryNameExists = await categoryModel.findOne({
			$and: [
				{ categoryName: categoryNamePattern },
				{ _id: { $ne: new mongoose.Types.ObjectId(categoryId) } },
			],
		});
		if (categoryNameExists) throw new Error(`${data.categoryName} category exists`);
		const category = await categoryModel.findOne({ _id: new mongoose.Types.ObjectId(categoryId) });
		if (!category) throw new Error("Category Not Found");

		if (data.createdBy && category.createdBy !== data.createdBy) {
			throw new Error("Not allowed to modify !");
		}

		const update = await categoryModel.findOneAndUpdate(
			{ _id: categoryId },
			{ $set: { ...data, updatedBy, updatedAt: new Date() } },
			{ new: true }
		);

		return update;
	} catch (error) {
		console.log(error.message);
		throw new Error(error.message);
	}
};

const deleteCategory = async (_id) => {
	try {
		const category = await categoryModel.findOne({ _id });
		if (!category) throw new Error("Category Not Found !");

		const softDel = await categoryModel.findOneAndUpdate({ _id }, { $set: { isBlocked: true } });
		return softDel;
	} catch (error) {
		console.log(error.message);
		throw new Error(error.message);
	}
};

const getAllCategoryDetails = async (
	page = 1,
	limit = 5,
	createdAt,
	categoryName,
	sortOrder,
	search = "",
	isBlocked = false
) => {
	const data = {};
	const query = {};
	const sortCriteria = {};

	const sortOption = { createdAt, categoryName, sortOrder };
	const activeSortEntry = Object.entries(sortOption).find(([field, order]) => order !== null);
	if (activeSortEntry) {
		const [field, order] = activeSortEntry;
		sortCriteria[field] = order;
	} else {
		sortCriteria["createdAt"] = -1;
	}

	if (search && search.trim() !== "") {
		const regex = new RegExp("^" + search, "i");
		query.$or = [{ categoryName: { $regex: regex } }];
	}

	if (isBlocked === true || isBlocked === false) {
		query.isBlocked = isBlocked;
	}

	try {
		if (limit > 5) limit = 5;
		const totalDocs = await categoryModel.countDocuments(query);
		const totalPages = Math.ceil(totalDocs / limit);
		if (page < 1) page = 1;
		if (page > totalPages) page = totalPages || 1;
		let skip = (page - 1) * limit;

		const category = await categoryModel
			.find(query)
			.skip(skip)
			.limit(limit)
			.sort(sortCriteria)
			.lean();

		data.totalPages = totalPages;
		data.page = page;
		data.limit = limit;
		data.data = category.map((items) => {
			return {
				id: items._id,
				categoryName: items.categoryName,
				parentCategory: items.parentCategory,
				description: items.description,
				categoryImage: items.categoryImage,
				isBlocked: items.isBlocked,
			};
		});

		return data;
	} catch (error) {
		console.log(error.message);
		throw new Error(error.message);
	}
};

export {
	createCategory,
	updateCategory,
	deleteCategory,
	getAllCategoryDetails,
	getParentCategories,
	getCategoryInfo,
};
