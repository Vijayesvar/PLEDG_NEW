import { StepperProps } from "./Stepper.types";
import { Check, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";

const Stepper = ({ currentStep }: StepperProps) => {
  const steps = [
    { name: "Basic Information", duration: "1 minute" },
    { name: "KYC Verification", duration: "2 minutes" },
    { 
      name: "Aadhaar Card Verification", 
      duration: "2 minutes",
      subSteps: ["Enter Aadhaar", "Verify OTP"]
    },
  ];

  return (
    <div className="relative h-full flex items-center justify-center">
      <div className="flex flex-col gap-8">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={index} className="relative flex items-center gap-4">
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full",
                  isCompleted ? "bg-gray-100" : "bg-white/30"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 text-profit" />
                ) : (
                  <CircleDashed
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-white animate-spin" : "text-white/20"
                    )}
                  />
                )}
              </div>
              <div>
                <h4
                  className={cn(
                    "font-semibold",
                    isActive || isCompleted ? "text-white" : "text-gray-400"
                  )}
                >
                  {step.name}
                </h4>
                <p className={cn(
                  "text-sm",
                  isActive || isCompleted ? "text-white/80" : "text-gray-400"
                )}>{step.duration}</p>
                
                {/* Show sub-steps for Aadhaar verification */}
                {step.subSteps && isActive && (
                  <div className="mt-2 flex flex-col gap-1">
                    {step.subSteps.map((subStep, subIndex) => (
                      <div key={subIndex} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white/40"></div>
                        <span className="text-xs text-white/60">{subStep}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper; 