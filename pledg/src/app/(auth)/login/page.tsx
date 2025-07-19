import Link from "next/link";
import LoginForm from "./components/LoginForm";
import BannerArt from "@/components/ui/auth/banner-art";
import { LoginFormData, LoginFormFieldConfig } from "@/types/auth";
import { FaEnvelope, FaLock } from "react-icons/fa";

export default function Login() {
  const fields: LoginFormFieldConfig<LoginFormData>[] = [
    {
      label: "Email Address",
      name: "email",
      type: "email",
      placeholder: "Enter your email address",
      icon: <FaEnvelope className="h-4 w-4"/>,
    },
    {
      label: "Password",
      name: "password",
      type: "password",
      placeholder: "Enter your password",
      icon: <FaLock className="h-4 w-4"/>,
    },
  ];

  return (
    <div className="p-3 flex h-screen w-full items-center justify-left text-foreground">
      
      <BannerArt
        className="w-[40%]"
        mainText="Pledg"
        subTextComponent={
          <><span className="font-semibold">Borrowing</span> has never been this <span className="font-semibold">easier.</span></>
        }
        subPartAHeader="Get Access"
        subPartAComponent={
          <>Email us at <a href="mailto:getaccess@pledg.com" className="text-white font-semibold underline">getaccess@pledg.com</a> to be one of the first to access our platform.</>
        }
        subPartBHeader="Questions?"
        subPartBComponent={
          <>Reach us at <a href="mailto:support@pledg.com" className="text-white font-semibold underline">support@pledg.com</a></>
        }
      />

      <LoginForm fields={fields} />
      
      <div className="absolute top-6 right-5 z-20">
        <span className="text-[13px] text-foreground/50 font-medium">
          
          {'Don\'t have an account? '}
          
          <Link
          href="/register"
          className="ml-1 border border-foreground/10 cursor-pointer hover:bg-foreground/2 font-medium p-1 px-2 rounded-md text-foreground/65">Register</Link>
        </span>
      </div>

      <div className="absolute bottom-4 right-5 z-20">
        <span className="text-xs text-foreground/40 font-medium">2025, Pledg</span>
      </div>
    
    </div>
  );
} 
