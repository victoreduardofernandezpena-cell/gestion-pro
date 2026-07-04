export const getCompanyId = (req) => req.user?.companyId;

export const requireCompanyId = (req) => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    const error = new Error("Compania requerida");
    error.status = 401;
    throw error;
  }
  return companyId;
};

export const scopedWhere = (req, where = {}) => ({
  ...where,
  companyId: requireCompanyId(req)
});

export const scopedData = (req, data = {}) => ({
  ...data,
  companyId: requireCompanyId(req)
});

export const sameCompanyOrNotFound = (record, message = "Registro no encontrado") => {
  if (!record) {
    const error = new Error(message);
    error.status = 404;
    throw error;
  }
  return record;
};
