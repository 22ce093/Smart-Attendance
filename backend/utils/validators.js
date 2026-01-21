// Validation Helpers for Registration
// Used by authController.js

// Full Name: No digits allowed
const validateFullName = (name) => {
  const regex = /^[A-Za-z\s]+$/;
  return regex.test(name);
};

// Email: Standard email format
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Phone: Exactly 10 digits
const validatePhone = (phone) => {
  const regex = /^\d{10}$/;
  return regex.test(phone);
};

// Password: Min 8 chars, at least 1 digit, at least 1 symbol
const validatePassword = (password) => {
  if (password.length < 8) return false;
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  return hasDigit && hasSymbol;
};

// Enrollment ID for Students: YY + BranchCode + 3-digit unique (e.g., 22CE093)
const validateEnrollmentId = (id) => {
  const regex = /^\d{2}[A-Z]{2}\d{3}$/;
  return regex.test(id);
};

// Teacher ID: BranchCode + 3-digit unique (e.g., CE001)
const validateTeacherId = (id) => {
  const regex = /^[A-Z]{2}\d{3}$/;
  return regex.test(id);
};

module.exports = {
  validateFullName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateEnrollmentId,
  validateTeacherId
};
