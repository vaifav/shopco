function requireAdminAuth(req, res, next) {
	if (!req.session?.user) {
		return res.redirect("/login");
	}
	const userRole = req.session.user.role;

	if (userRole === "admin") {
		next();
	} else {
		console.log(`Access denied: Admin tried to access admin route.`);
		return res.redirect("/");
	}
}

function requireAuth(req, res, next) {
	if (!req.session?.user) return res.redirect("/login");

	if (req.session.user.role === "user") {
		next();
	} else {
		console.log(`Access denied: Admin tried to access user route.`);
		return res.redirect("/admin");
	}
}

export { requireAuth, requireAdminAuth };
