import { RadioGroupProps } from "./RadioGroup.types";
import FormLabel from "./FormLabel";

const RadioGroup = ({ label, required, options, selectedOption, onChange }: RadioGroupProps) => (
  <div>
    <FormLabel label={label} required={required} />
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
      {options.map((option) => (
        <label
          key={option}
          className="flex items-center text-[12px] font-regular text-foreground/80 mb-2 space-x-2  cursor-pointer"
        >
          <input
            type="radio"
            name={label}
            value={option}
            checked={selectedOption === option}
            onChange={(e) => onChange(e.target.value)}
            className="h-4 w-4 text-primary focus:ring-primary border-header"
          />
          <span className="capitalize font-medium">{option}</span>
        </label>
      ))}
    </div>
  </div>
);

export default RadioGroup; 