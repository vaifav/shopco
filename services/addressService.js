import addressModel from "../models/addressModel.js";

function isNotValidUserName(username) {
	if (!username) {
		return "Username is required.";
	}

	const minLength = 3;
	const maxLength = 20;
	if (username.length < minLength || username.length > maxLength) {
		return `Username must be between ${minLength} and ${maxLength} characters long.`;
	}

	const validCharsRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9_.-]+$/;
	if (!validCharsRegex.test(username)) {
		return "Username can only contain letters, numbers, periods (.), hyphens (-), and underscores (_).";
	}

	if (username.trim() !== username) {
		return "Username cannot contain leading or trailing spaces.";
	}

	return null;
}

const getAddress = async (userId) => {
	try {
		if (!userId) throw new Error("User ID is required");
		const addresses = await addressModel.find({ userId });
		return addresses;
	} catch (error) {
		console.error("Error fetching addresses:", error.message);
		throw new Error(error.message);
	}
};

const getSingleAddress = async (id, userId) => {
	try {
		if (!id || !userId) throw new Error("Address ID and User ID are required");
		const address = await addressModel.findOne({ _id: id, userId });
		if (!address) throw new Error("Address not found");
		return address;
	} catch (error) {
		console.error("Error fetching single address:", error.message);
		throw new Error(error.message);
	}
};

const createAddress = async (data) => {
	try {
		const requiredFields = ["userId", "fullName", "phone", "country", "state", "city", "street", "houseName", "pin"];

		for (const field of requiredFields) {
			if (!data[field]) throw new Error(`Field "${field}" is required`);
		}
		const notValidUserName = isNotValidUserName(data.fullname)
		if(notValidUserName) throw new Error(notValidUserName);

		const address = await addressModel.create(data);
		return address;
	} catch (error) {
		console.error("Error creating address:", error.message);
		throw new Error(error.message);
	}
};

const updateAddress = async (id, userId, updateObj) => {
	try {
		if (!id || !userId) throw new Error("Address ID and User ID are required");
		const address = await addressModel.findOneAndUpdate({ _id: id, userId }, { $set: updateObj }, { new: true, runValidators: true });
		if (!address) throw new Error("Address not found or unauthorized");
		return address;
	} catch (error) {
		console.error("Error updating address:", error);
		throw new Error(error.message);
	}
};

const deleteAddress = async (id, userId) => {
	try {
		if (!id || !userId) throw new Error("Address ID and User ID are required");
		const deleted = await addressModel.findOneAndDelete({ _id: id, userId });
		if (!deleted) throw new Error("Address not found or unauthorized");
		return deleted;
	} catch (error) {
		console.error("Error deleting address:", error.message);
		throw new Error(error.message);
	}
};

export { getAddress, getSingleAddress, createAddress, updateAddress, deleteAddress };
