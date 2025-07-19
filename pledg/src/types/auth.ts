export interface LoginFormData {
    email: string;
    password: string;
    [key: string]: string;
}

export interface LoginFormFieldConfig<T extends LoginFormData> {
    label: string;
    name: keyof T;
    type: string;
    placeholder: string;
    icon: React.ReactNode;
}