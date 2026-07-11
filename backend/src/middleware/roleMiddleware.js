export const canAccessRole = (user, roles = []) => {
  return Boolean(user && roles.includes(user.role));
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    if (!canAccessRole(req.user, roles)) {
      return res.status(403).json({ message: "No tienes permiso para acceder a este recurso" });
    }

    next();
  };
};
