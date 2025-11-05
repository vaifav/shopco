function baseAuth(req, res, next) {
	if (req.session?.user) {
		if (req.session.user.role === "admin") {
			console.log(`Access denied: Admin tried to access public/user route.`);
			return res.redirect("/admin");
		}
	}
	next();
}

function requireAuth(req, res, next) {
	if (!req.session?.user) {
		return res.redirect("/login");
	}

	const userRole = req.session.user.role;

	if (userRole === "user") {
		next();
	} else {
		console.log(`Access denied: Non-user role (${userRole}) tried to access user route.`);
		return res.redirect("/admin");
	}
}

function requireAdminAuth(req, res, next) {
	if (!req.session?.user) {
		return res.redirect("/login");
	}

	const userRole = req.session.user.role;

	if (userRole === "admin") {
		next();
	} else {
		console.log(`Access denied: User with role '${userRole}' tried to access admin route.`);
		return res.redirect("/");
	}
}

function checkBlockStatus(req, res, next) {
	if (req.session?.user && req.session.user.isBlocked) {
		req.session.destroy((err) => {
			if (err) {
				console.error("Error destroying session for blocked user:", err);
			}
			return res.render("user/login", {
				error: "You are Blocked, Contact +91 677 3443 523 for more information...",
			});
		});
	} else {
		next();
	}
}

function isVerified(req, res, next) {
    if (req.session?.user && req.session.user.isVerified === false) {
        console.log(`Access denied: Unverified user tried to access protected route. Redirecting to /verifyotp.`);

        if (req.originalUrl !== '/verifyotp') {
            return res.redirect("/verifyotp");
        }
    }
    next();
}

export { requireAuth, requireAdminAuth, baseAuth, checkBlockStatus, isVerified };
