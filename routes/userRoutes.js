import { Router } from "express";
import home from "../controllers/user/homeController.js";
import { account } from "../controllers/user/accountContoller.js";
import { addAddress, editAddress, removeAddress } from "../controllers/user/addressController.js";
import { addPersonalInfo, editPersonlInfo } from "../controllers/user/personalInfoController.js";
import { upload } from "../middleware/multerMiddleware.js";

const user = Router();

user.get("/", home);
user.get("/account", account);

user.post("/address", addAddress);
user.route("/address/:id").patch(editAddress).delete(removeAddress);

user
	.route("/personalinfo/")
	.post(upload.single("profile"), addPersonalInfo)
	.patch(upload.single("profile"), editPersonlInfo);

export default user;
