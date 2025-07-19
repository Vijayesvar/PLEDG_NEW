import { LoginFormData } from "@/types/auth";
import useFormValidation from "../useFormValidation";
import { login } from "@/api/auth";
import { useRouter } from "next/navigation";

const initialData: LoginFormData = {
    email: "",
    password: ""
}

export default function useLoginForm() {
    const { formData, validatedFields, handleInputChange, handleBlur } = useFormValidation<LoginFormData>(initialData);
    const router = useRouter();
    const handleLogin = async () => {
        const success = await login({ email: formData.email, password: formData.password });
        if (success) {
            router.push("/");
        }
    }

    return { formData, validatedFields, handleInputChange, handleBlur, handleLogin };
}