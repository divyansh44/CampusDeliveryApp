const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    return next(new Error("Forbidden. You do not have access to this resource."));
  }

  next();
};

module.exports = { authorize };
