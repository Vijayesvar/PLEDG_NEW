import { Info } from "lucide-react";
import { FormLabelProps } from "./FormLabel.types";

const FormLabel = ({ label, required, tooltip }: FormLabelProps) => (
  <label className="flex items-center text-[12px] font-regular text-foreground/80 mb-2">
    {label}
    {required && <span className="ml-1 text-[12px] text-red-500/90">*</span>}
    {tooltip && (
      <div className="group relative ml-2">
        <Info className="h-4 w-4 text-gray-400" />
        <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          {tooltip}
        </span>
      </div>
    )}
  </label>
);

export default FormLabel; 