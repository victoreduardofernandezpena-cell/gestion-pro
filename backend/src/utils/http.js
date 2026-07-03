export const parseIdParam = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const sendDeleted = (res, resourceName) => {
  return res.json({ message: `${resourceName} eliminado correctamente` });
};
