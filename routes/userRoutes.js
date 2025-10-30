import { Router } from "express";
import home from "../controllers/user/homeController.js";
import { account } from "../controllers/user/accountContoller.js";
import { addAddress, editAddress, removeAddress } from "../controllers/user/addressController.js";
import { addPersonalInfo, editPersonlInfo } from "../controllers/user/personalInfoController.js";
import { upload } from "../middleware/multerMiddleware.js";
import { products, singleProduct } from "../controllers/user/productController.js";
import { baseAuth, requireAuth } from "../middleware/authMiddleware.js";

const user = Router();

user.get("/username", (req, res) => res.json({ username: req.session?.user?.username }));

user.get("/", baseAuth, home);
user.get("/products", baseAuth, products);
user.get("/products/:id/:varId", baseAuth, singleProduct);

user.get("/account", requireAuth, account);
user.post("/address", requireAuth, addAddress);
user.route("/address/:id").patch(requireAuth, editAddress).delete(requireAuth, removeAddress);

user
	.route("/personalinfo/")
	.post(requireAuth, upload.single("profile"), addPersonalInfo)
	.patch(requireAuth, upload.single("profile"), editPersonlInfo);

export default user;
