// middleware/authMiddleware.js

export const isAuthenticated = (req, res, next) => {
  if (req.session.user || req.user) {
    return next();
  }
  res.redirect("/login");
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const role = req.session.user?.role || req.user?.role;
    if (!role) return res.redirect("/login");

    if (!roles.includes(role)) {
      return res.status(403).render("user/noaccess"); // or redirect to a "no access" page
    }
    next();
  };
};
