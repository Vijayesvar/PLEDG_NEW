"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeString = exports.sanitizePhoneNumber = exports.sanitizeEmail = exports.sanitizeUserInput = void 0;
const sanitizeUserInput = (data) => {
    return {
        firstName: data.firstname?.trim() || '',
        lastName: data.lastname?.trim() || '',
        email: data.email?.toLowerCase().trim() || '',
        phoneNumber: data.phoneNumber?.trim() || undefined,
        password: data.password?.trim() || '',
        dateOfBirth: data.dob ? new Date(data.dob) : new Date(),
        gender: data.gender?.trim() || undefined,
        address: data.address?.trim() || undefined,
    };
};
exports.sanitizeUserInput = sanitizeUserInput;
const sanitizeEmail = (email) => {
    return email.toLowerCase().trim();
};
exports.sanitizeEmail = sanitizeEmail;
const sanitizePhoneNumber = (phoneNumber) => {
    return phoneNumber.trim().replace(/\s+/g, '');
};
exports.sanitizePhoneNumber = sanitizePhoneNumber;
const sanitizeString = (str) => {
    return str.trim();
};
exports.sanitizeString = sanitizeString;
//# sourceMappingURL=sanitize.js.map