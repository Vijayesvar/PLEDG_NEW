"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeft, HomeIcon } from "lucide-react";
import { FaEnvelope, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import DateInput from "@/components/ui/login/components/DateInput";
import RadioGroup from "@/components/ui/login/components/RadioGroup";
import Checkbox from "@/components/ui/login/components/Checkbox";
import Stepper from "@/components/ui/login/components/Stepper";
import AadhaarInput from "@/components/ui/login/components/AadhaarInput";
import OtpInput from "@/components/ui/login/components/OtpInput";
import { registerBasic, registerBank, sendAadhaarOtp, verifyAadhaarKyc } from "@/api/auth";
import CustomTextInput from "@/components/ui/login/Input";

export default function Register() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [aadhaarSubStep, setAadhaarSubStep] = useState(0); // 0: Enter Aadhaar, 1: Verify OTP
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    gender: "male",
    dob: "",
    address: "",
    password: "",
    phoneNumber: "",
    agreedToTerms: false,
    aadhaarNumber: "",
    referenceId: "",
    otp: "",
  });

  const [validatedFields, setValidatedFields] = useState<Record<string, boolean>>({});

  // Handle OTP resend countdown
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleOtpChange = (otp: string) => {
    setFormData((prev) => ({
      ...prev,
      otp: otp,
    }));
  };

  const handleGenderChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      gender: value,
    }));
  };

  const validateField = (name: string, value: string): boolean => {
    switch (name) {
      case "firstname":
      case "lastname":
        return value.trim().length >= 1;
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case "password":
        return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
      case "phoneNumber":
        return value === "" || /^[6-9]\d{9}$/.test(value.replace(/\s/g, ""));
      case "dob":
        return value !== "";
      case "address":
        return value.trim().length >= 10;
      case "gender":
        return ["male", "female", "others"].includes(value);
      case "aadhaarNumber":
        return /^\d{12}$/.test(value);
      case "otp":
        return /^\d{6}$/.test(value);
      default:
        return true;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value.trim().length === 0) {
      setValidatedFields((prev) => {
        const newState = { ...prev };
        delete newState[name];
        return newState;
      });
      return;
    }

    const isValid = validateField(name, value);
    setValidatedFields((prev) => ({ ...prev, [name]: isValid }));
  };

  const isStep1Valid = () => {
    const requiredFields = ["firstname", "lastname", "email", "gender", "dob", "address", "password"];
    return requiredFields.every(field => {
      if (field === "gender") return formData.gender !== "" && validateField("gender", formData.gender);
      if (field === "dob") return formData.dob !== "";
      return formData[field as keyof typeof formData] && 
             validatedFields[field] !== false;
    }) && formData.agreedToTerms;
  };

  const handleBasicRegistration = async () => {
    if (!isStep1Valid()) {
      toast.error("Please fill in all required fields correctly and agree to terms.");
      return;
    }

    setIsLoading(true);

    try {
      const registrationData = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        gender: formData.gender,
        dob: formData.dob,
        address: formData.address,
        password: formData.password,
        phoneNumber: formData.phoneNumber || undefined,
      };

      await registerBasic(registrationData);
      setCurrentStep(1);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(`Registration failed. Please try again. Error: ${err.message}`);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBankVerification = async () => {
    setIsLoading(true);

    try {
      await registerBank();
      setCurrentStep(2);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(`Bank verification failed. Please try again. Error: ${err.message}`);
      } else {
        toast.error("Bank verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAadhaarOtp = async () => {
    if (!validateField("aadhaarNumber", formData.aadhaarNumber)) {
      toast.error("Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await sendAadhaarOtp({
        aadhaarNumber: formData.aadhaarNumber,
      });
      
      setFormData((prev) => ({
        ...prev,
        referenceId: response.referenceId,
      }));
      
      setAadhaarSubStep(1);
      setResendCountdown(120); // 2 minutes countdown
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(`Failed to send OTP. Please try again. Error: ${err.message}`);
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    
    setIsLoading(true);

    try {
      await sendAadhaarOtp({
        aadhaarNumber: formData.aadhaarNumber,
      });
      
      setResendCountdown(120); // 2 minutes countdown
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(`Failed to resend OTP. Please try again. Error: ${err.message}`);
      } else {
        toast.error("Failed to resend OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAadhaarKyc = async () => {
    if (!validateField("otp", formData.otp)) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyAadhaarKyc({
        referenceId: formData.referenceId,
        otp: formData.otp,
        aadhaarNumber: formData.aadhaarNumber,
      });
      
      // Check if verification was successful or requires manual review
      if (response.message.includes("successfully")) {
        // Success - redirect to dashboard
        router.push("/");
      } else if (response.message.includes("manual review")) {
        toast.error("KYC verification requires manual review. You will be notified once approved.");
        setTimeout(() => router.push("/"), 3000);
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(`Aadhaar verification failed. Please try again. Error: ${err.message}`);
      } else {
        toast.error("Aadhaar verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 2 && aadhaarSubStep === 1) {
      setAadhaarSubStep(0);
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="p-3 flex h-screen w-full items-center justify-left text-foreground">
      <div className="flex h-full w-full rounded-lg">
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden rounded-xl transition-all duration-700 ease-in-out",
            "w-[30%]"
          )}
        >
          <Image
            alt="Decorative jungle painting by Henri Rousseau"
            src="/banner.png" 
            width={800}
            height={1200}
            className={cn(
              "h-full w-full object-cover rounded-lg",
              "trasnition-all duration-700 ease-in-out blur-[2px]"
            )}
          />
          <div className="absolute inset-0 bg-black/30" />
          <Image
            src="/pledg.svg"
            alt="Pledg Logo"
            width={70}
            height={70}
            className="absolute top-4 left-4 rounded-md p-2 text-xl font-bold text-white"
          />
          <div className="absolute top-5 left-24 flex items-center justify-center">
            <p className="text-white text-[24px] font-bold">Pledg</p>
          </div>
          <div className="absolute top-14 left-24 flex items-center justify-center">
            <p className="text-white text-sm font-light">
              <span className="font-semibold">Borrowing</span> has never been this <span className="font-semibold">easier.</span>
            </p>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <Stepper currentStep={currentStep} />
          </div>
        </div>

        <div className="flex-1 flex w-full flex-1 flex-col justify-center p-12">
          <div>
            {currentStep === 0 && (
              <div className="mx-auto text-left w-full max-w-sm p-6 rounded-xl shadow-[0_0_10px_0_rgba(0,0,0,0.01)] bg-secondary min-w-2xl">
                <button
                  onClick={()=>{
                    router.push("/login");
                  }}
                  className="mb-3 flex items-center font-medium justify-center gap-1 text-[13px] text-foreground/80 hover:text-foreground/65 cursor-pointer"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Back to Login
                </button>
                <h2 className="text-[1.8rem] font-semibold">Basic Information</h2>
                <p className="mt-1 text-[13px] text-subtext mb-6">Enter your details to register</p>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <CustomTextInput
                      label="First Name"
                      name="firstname"
                      icon={<FaUser className="h-4 w-4"/>}
                      required
                      value={formData.firstname}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                    />
                    <CustomTextInput
                      label="Last Name"
                      name="lastname"
                      icon={<FaUser className="h-4 w-4"/>}
                      required
                      value={formData.lastname}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Enter your last name"
                    />
                  </div>
                  <CustomTextInput
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    icon={<FaEnvelope className="h-4 w-4"/>}
                  />
                  
                  <RadioGroup
                    label="Gender"
                    required
                    options={["male", "female", "non-binary", "prefer not to say"]}
                    selectedOption={formData.gender}
                    onChange={handleGenderChange}
                  />
                  <DateInput
                    label="Date of Birth"
                    name="dob"
                    required
                    value={formData.dob}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                  />
                  <div className="flex gap-4">
                    <CustomTextInput
                      label="Phone Number"
                      name="phoneNumber"
                      prefix="+91"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="9876543210"
                    />
                    <CustomTextInput
                      label="Where are you located in?"
                      name="address"
                      icon={<FaMapMarkerAlt className="h-4 w-4"/> }
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Coimbatore, India"
                    />
                  </div>
                  <CustomTextInput
                    label="Password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter your password"
                  />
                  <Checkbox
                    checkboxSize="md"
                    label={
                      <span className="text-[12px] font-medium text-foreground/80">
                        I agree to the{" "}
                        <a href="#" className="text-primary hover:underline">
                          Terms and Conditions
                        </a>
                      </span>
                    }
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={handleInputChange}
                  />
                </div>
                <button
                    onClick={handleBasicRegistration}
                    disabled={isLoading || !isStep1Valid()}
                    className="mt-6 w-full  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded-lg bg-gradient-to-t from-button/95 to-button/80 px-4 py-3 text-white text-[14px] font-semibold hover:bg-button/25 transition-colors shadow-[0_0_0_10px_rgba(0,0,0,0.1)] [box-shadow:inset_0_2px_8px_0_rgba(0,0,0,0.06)]"
                    >
                    {isLoading ? "Processing..." : "Next"}
                </button>
              </div>
            )}
            {currentStep === 1 && (
              <div className="mx-auto text-left w-full max-w-sm p-6 rounded-xl shadow-[0_0_10px_0_rgba(0,0,0,0.01)] bg-secondary min-w-2xl">
                <div className="absolute flex gap-2 items-center justify-center top-5 right-5 z-20">
                  <Link href="/" className="flex items-center gap-1">
                    <div className="text-[13px] text-foreground/50 font-medium">
                      Skip for now
                    </div>
                    <div className="ml-1 border flex items-center justify-center border-foreground/10 cursor-pointer hover:bg-foreground/2 font-medium p-1 h-6 w-6 rounded-md text-foreground/65">
                      <HomeIcon className="h-4 w-4" />
                    </div>
                  </Link>
                </div>                
                <button
                  onClick={handlePreviousStep}
                  className="mb-3 flex items-center font-medium justify-center gap-1 text-[13px] text-foreground/80 hover:text-foreground/65 cursor-pointer"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Previous
                </button>
                <h2 className="text-[1.8rem] font-semibold">Bank Verification</h2>
                <p className="mt-1 text-[13px] text-subtext mb-6">Enter your bank details to verify your account</p>
                <button
                  onClick={handleBankVerification}
                  disabled={isLoading}
                  className="mt-6 w-full  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded-lg bg-gradient-to-t from-button/95 to-button/80 px-4 py-3 text-white text-[14px] font-semibold hover:bg-button/25 transition-colors shadow-[0_0_0_10px_rgba(0,0,0,0.1)] [box-shadow:inset_0_2px_8px_0_rgba(0,0,0,0.06)]"
                >
                  {isLoading ? "Processing..." : "Verify Bank Account"}
                </button>
              </div>
            )}
            {currentStep === 2 && (
              <div className="mx-auto text-left w-full max-w-sm p-6 rounded-xl shadow-[0_0_10px_0_rgba(0,0,0,0.01)] bg-secondary min-w-2xl">
                <div className="absolute flex gap-2 items-center justify-center top-5 right-5 z-20">
                  <Link href="/" className="flex items-center gap-1">
                    <div className="text-[13px] text-foreground/50 font-medium">
                      Skip for now
                    </div>
                    <div className="ml-1 border flex items-center justify-center border-foreground/10 cursor-pointer hover:bg-foreground/2 font-medium p-1 h-6 w-6 rounded-md text-foreground/65">
                      <HomeIcon className="h-4 w-4" />
                    </div>
                  </Link>
                </div>
                {aadhaarSubStep === 0 ? (
                  // Step 2A: Enter Aadhaar Number
                  <div className="w-full">
                    <button
                      onClick={handlePreviousStep}
                      className="mb-3 flex items-center font-medium justify-center gap-1 text-[13px] text-foreground/80 hover:text-foreground/65 cursor-pointer"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      Previous
                    </button>
                    <h2 className="text-[1.8rem] font-semibold">Aadhaar Card Verification</h2>
                    <p className="mt-1 text-[13px] text-subtext mb-6">Enter your Aadhaar number to receive OTP</p>
                    <AadhaarInput
                      label="Aadhaar Number"
                      name="aadhaarNumber"
                      required
                      value={formData.aadhaarNumber}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                    />
                    <button
                      onClick={handleSendAadhaarOtp}
                      disabled={isLoading || !validateField("aadhaarNumber", formData.aadhaarNumber)}
                      className="mt-6 w-full  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded-lg bg-gradient-to-t from-button/95 to-button/80 px-4 py-3 text-white text-[14px] font-semibold hover:bg-button/25 transition-colors shadow-[0_0_0_10px_rgba(0,0,0,0.1)] [box-shadow:inset_0_2px_8px_0_rgba(0,0,0,0.06)]"
                    >
                      {isLoading ? "Sending OTP..." : "Send OTP"}
                    </button>
                  </div>
                ) : (
                  // Step 2B: Verify OTP
                  <div className="w-full">
                    <h2 className="text-[1.8rem] font-semibold">Aadhaar Card Verification</h2>
                    <p className="mt-1 text-[13px] text-subtext mb-6">Enter the 6-digit OTP sent to your registered mobile number</p>
                    <OtpInput
                      label="Enter OTP"
                      name="otp"
                      required
                      onOtpChange={handleOtpChange}
                      onResend={handleResendOtp}
                      resendDisabled={resendCountdown > 0}
                      resendCountdown={resendCountdown}
                    />
                    <button
                      onClick={handleVerifyAadhaarKyc}
                      disabled={isLoading || !validateField("otp", formData.otp)}
                      className="mt-6 w-full  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded-lg bg-gradient-to-t from-button/95 to-button/80 px-4 py-3 text-white text-[14px] font-semibold hover:bg-button/25 transition-colors shadow-[0_0_0_10px_rgba(0,0,0,0.1)] [box-shadow:inset_0_2px_8px_0_rgba(0,0,0,0.06)]"
                    >
                      {isLoading ? "Verifying..." : "Verify KYC"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-4 right-5 z-20">
          <span className="text-xs text-foreground/40 font-medium">2025, Pledg</span>
        </div>
      </div>
    </div>
  );
} 
