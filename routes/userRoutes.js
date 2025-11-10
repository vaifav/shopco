import { Router } from "express";
import home from "../controllers/user/homeController.js";
import {
	addAddress,
	editAddress,
	getAddressPage,
	removeAddress,
} from "../controllers/user/addressController.js";
import {
	addPersonalInfo,
	editPersonlInfo,
	getPersonalInfoPage,
} from "../controllers/user/personalInfoController.js";
import { upload } from "../middleware/multerMiddleware.js";
import {
	products,
	singleProduct,
	singleProductByColor,
} from "../controllers/user/productController.js";
import { baseAuth, isVerified, requireAuth } from "../middleware/authMiddleware.js";

const user = Router();

user.get("/username", (req, res) => {
	if (req.session?.user?.isVerified) {
		return res.json({ username: req.session?.user?.username });
	}
	return res.json({});
});

user.get("/", baseAuth, home);
user.get("/products", baseAuth, products);
user.get("/products/:id/:varId", baseAuth, singleProduct);
user.get("/products/:id/:varId/:color", baseAuth, singleProductByColor);

user.get("/account", requireAuth, isVerified, getPersonalInfoPage);
user.get("/address", requireAuth, isVerified, getAddressPage);
user.post("/address", requireAuth, isVerified, addAddress);
user
	.route("/address/:id")
	.patch(requireAuth, isVerified, editAddress)
	.delete(requireAuth, isVerified, removeAddress);

user
	.route("/personalinfo/")
	.post(requireAuth, isVerified, upload.single("profile"), addPersonalInfo)
	.patch(requireAuth, isVerified, upload.single("profile"), editPersonlInfo);

export default user;
