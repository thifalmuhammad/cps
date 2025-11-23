// Validation utilities

// UUID validation
const validateUuid = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
const validatePassword = (password) => {
  return password && password.length >= 6;
};

// String length validation
const validateStringLength = (str, minLength = 1, maxLength = 255) => {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
};

// Number validation
const validateNumber = (num, min = null, max = null) => {
  if (typeof num !== 'number' || isNaN(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
};

// Date validation
const validateDate = (date) => {
  if (!date) return false;
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate);
};

// Sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim();
};

// Sanitize email
const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim();
};

module.exports = {
  validateUuid,
  validateEmail,
  validatePassword,
  validateStringLength,
  validateNumber,
  validateDate,
  sanitizeString,
  sanitizeEmail,
};