function toLogin(req, res, next) {
	if (!req.session?.user) return res.redirect("/login");
	next();
}

function toHome(req, res, next) {
	if (req.session?.user) return res.redirect("/");
	next();
}

function noCache(req, res, next) {
	res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
	next();
}

export { toHome, toLogin, noCache };
