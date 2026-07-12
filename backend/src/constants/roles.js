export const rolePermissions = {
  admin: ["*"],
  ventas: ["clients:read", "clients:write", "products:read", "invoices:read", "invoices:create", "payments:create", "accounts-receivable:read", "loyalty:read", "loyalty:redeem"],
  almacen: ["products:read", "products:write", "inventory:read", "inventory:write", "warehouses:read", "warehouses:write", "brands:read", "brands:write"],
  contabilidad: ["invoices:read", "payments:create", "purchases:read", "purchases:write", "accounts-receivable:read", "accounts-payable:read", "bank:write", "cashbox:write", "expenses:write", "reports:read"]
};

export const roleHasPermission = (role, permission) => {
  const permissions = rolePermissions[role] || [];
  return permissions.includes("*") || permissions.includes(permission);
};
