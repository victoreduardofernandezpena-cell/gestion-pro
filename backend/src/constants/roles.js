export const rolePermissions = {
  admin: ["*"],
  ventas: ["clients:read", "products:read", "invoices:read", "invoices:create", "payments:create", "loyalty:read", "loyalty:redeem"],
  almacen: ["products:read", "products:write", "inventory:read", "inventory:write", "warehouses:write", "brands:write"],
  contabilidad: ["invoices:read", "payments:create", "purchases:read", "purchases:write", "bank:write", "cashbox:write", "expenses:write", "reports:read"]
};

export const roleHasPermission = (role, permission) => {
  const permissions = rolePermissions[role] || [];
  return permissions.includes("*") || permissions.includes(permission);
};
