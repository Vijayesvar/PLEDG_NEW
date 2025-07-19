import { useState } from "react";
import { handleBlurUtil, handleInputChangeUtil } from "@/lib/utils";

export default function useFormValidation<T extends Record<string, string>>(initialData: T) {
    const [formData, setFormData] = useState<T>(initialData);
    const [validatedFields, setValidatedFields] = useState<Record<string, boolean>>({});

    const handleInputChange = handleInputChangeUtil<T>(setFormData);
    
    const handleBlur = handleBlurUtil<T>(setValidatedFields, ()=>formData);

    return { formData, validatedFields, handleInputChange, handleBlur };
}

