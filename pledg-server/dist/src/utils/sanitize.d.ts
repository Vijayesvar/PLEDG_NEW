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
export declare const sanitizeUserInput: (data: any) => SanitizedUserData;
export declare const sanitizeEmail: (email: string) => string;
export declare const sanitizePhoneNumber: (phoneNumber: string) => string;
export declare const sanitizeString: (str: string) => string;
//# sourceMappingURL=sanitize.d.ts.map