import { Router } from "express";
import home from "../controllers/user/homeController.js";
import { noCache, toLogin } from "../middleware/loginMiddleware.js";
import { account } from "../controllers/user/accountContoller.js";
import { addAddress, editAddress, removeAddress } from "../controllers/user/addressController.js";
import { addPersonalInfo, editPersonlInfo } from "../controllers/user/personalInfoController.js";
import upload from "../middleware/multerMiddleware.js";
const user = Router();

user.use(noCache);
user.get("/", toLogin, home);
user.get("/account", toLogin, account);

user.post("/account/manageaddress/add/", toLogin, addAddress);
user.patch("/account/manageaddress/edit/:id", toLogin, editAddress);
user.delete("/account/manageaddress/delete/:id", toLogin, removeAddress);

user.post("/account/personalinfo/add", toLogin, upload.single("profile"), addPersonalInfo);
user.patch("/account/personalinfo/edit", toLogin, upload.single("profile"), editPersonlInfo);

export default user;

// grouping of routes using prefix, mongoose hooks
