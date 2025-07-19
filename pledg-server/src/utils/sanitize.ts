export interface SanitizedUserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  dateOfBirth: Date;
  gender?: string;
  address?: string;
}

export const sanitizeUserInput = (data: any): SanitizedUserData => {
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

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizePhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.trim().replace(/\s+/g, '');
};

export const sanitizeString = (str: string): string => {
  return str.trim();
}; 