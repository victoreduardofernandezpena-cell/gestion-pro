const weakPasswords = new Set(["12345678", "password", "admin123", "admin", "demo123"]);

export const validatePasswordPolicy = (password) => {
  if (!password) return "La nueva contrasena es obligatoria";
  if (password.length < 8) return "La nueva contrasena debe tener al menos 8 caracteres";
  if (!/[A-Za-z]/.test(password)) return "La nueva contrasena debe incluir al menos una letra";
  if (!/\d/.test(password)) return "La nueva contrasena debe incluir al menos un numero";
  if (weakPasswords.has(password.toLowerCase())) return "La nueva contrasena es demasiado debil";
  return "";
};
