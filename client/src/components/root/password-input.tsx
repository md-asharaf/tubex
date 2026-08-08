import { forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
    className?: string;
    id?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    [key: string]: any;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    (
        {
            className = "",
            id,
            value = "",
            onChange,
            placeholder = "Enter your password",
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);

        const togglePasswordVisibility = () => {
            setShowPassword((prev) => !prev);
        };

        return (
            <div className="relative">
                <Input
                    ref={ref}
                    id={id}
                    value={value}
                    onChange={onChange}
                    type={showPassword ? "text" : "password"}
                    placeholder={placeholder}
                    className={`pr-10 ${className}`}
                    {...props}
                />

                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-2 flex items-center"
                >
                    {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-500" />
                    ) : (
                        <Eye className="w-5 h-5 text-gray-500" />
                    )}
                </button>
            </div>
        );
    }
);
