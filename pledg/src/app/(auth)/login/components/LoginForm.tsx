"use client";

import { FcGoogle } from "react-icons/fc";
import Input from "@/components/ui/login/Input";
import { googleLogin } from "@/api/auth";
import { toast } from "sonner";
import { useGoogleLogin } from '@react-oauth/google';
import useLoginForm from "@/hooks/auth/useLoginForm";
import { useRouter } from "next/navigation";
import { LoginFormFieldConfig, LoginFormData } from "@/types/auth";

export default function LoginForm({ fields }: { fields: LoginFormFieldConfig<LoginFormData>[] }) {
  const { formData, validatedFields, handleInputChange, handleBlur, handleLogin } = useLoginForm();
  const router = useRouter();
  const googleLoginHandler = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        const data = await googleLogin(codeResponse.code);
        toast.success(data.message || "Google login successful!");
        router.push("/");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Google login failed.");
      }
    },
    onError: (error) => console.log(error)
  });

  return (
    <div className="flex-1 flex w-full flex-1 flex-col justify-center p-12">
      <div className="mx-auto text-left w-full max-w-sm p-6 rounded-xl shadow-[0_0_10px_0_rgba(0,0,0,0.01)] bg-secondary min-w-lg">
        <h2 className="text-2xl font-semibold">Login</h2>
        <p className="mt-1 text-[13px] text-subtext">Enter your details to login</p>
        
        <div className="mt-6 space-y-4">
          {fields.map((field) => (
            <Input
              key={field.name}
              label={field.label}
              name={field.name as string}
              type={field.type}
              placeholder={field.placeholder}
              required
              value={formData[field.name]}
              onChange={handleInputChange}
              onBlur={handleBlur}
              icon={field.icon}
              error={validatedFields[field.name] === false ? `Invalid ${field.label}` : undefined}
            />
          ))}
        </div>
        
        {/* <div className="text-xs font-medium text-foreground mt-2">Forgot Password?</div> */}
        
        <button
          onClick={handleLogin}
          className="mt-6 w-full cursor-pointer rounded-lg bg-gradient-to-t from-button/95 to-button/80 px-4 py-3 text-white text-[14px] font-semibold hover:bg-button/25 transition-colors shadow-[0_0_0_10px_rgba(0,0,0,0.1)] [box-shadow:inset_0_2px_8px_0_rgba(0,0,0,0.06)]"
        >
          Log in
        </button>
        
        <div className="relative flex justify-center my-2">
          <div className="w-full h-[1px] bg-header my-5"></div>
          <div className="absolute bottom-3 text-center bg-secondary px-3 text-[13px] rounded-md justify-center items-center flex text-center text-subtext">or</div>
        </div>

        <div className="mb-2 space-y-4">
          <button
            onClick={() => googleLoginHandler()}
            className="flex w-full items-center cursor-pointer bg-gradient-to-t from-white/95 to-white/80 justify-center gap-3 rounded-md border border-header/50 py-3 px-4 text-[14px] font-semibold hover:bg-black/15 shadow-[0_0_0_10px_rgba(0,0,0,0.1)] [box-shadow:inset_0_2px_8px_0_rgba(0,0,0,0.06)]"
          >
            <FcGoogle className="h-4 w-4" />
            Log in with Google
          </button>
        </div>
      </div>
    </div>
  );
} 