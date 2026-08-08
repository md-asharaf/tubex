import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { userService } from "@/services/user";
import { PasswordInput } from "@/components/root/password-input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const ResetPassword = () => {
    const navigate = useNavigate();
    const { resetToken } = useParams();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            await userService.resetPassword(resetToken as string, password);
            toast.success("Password reset successfully.");
            navigate("/login");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
    };

    return (
        <div className="w-full max-w-[450px] p-8 mx-4 bg-white dark:bg-[#0f0f0f] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex flex-col items-center mb-8">
                <div className="flex items-center gap-1 mb-4">
                    <img src="/logo.png" alt="TubeX Logo" className="w-8 h-8" />
                    <span className="text-xl font-semibold tracking-tight text-black dark:text-white">TubeX</span>
                </div>
                <h2 className="text-[24px] font-normal text-black dark:text-white">Reset password</h2>
                <p className="text-black/70 dark:text-white/70 mt-3 text-[15px] text-center">
                    Enter your new password below
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                    <PasswordInput
                        id="password"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                        className="peer w-full h-[54px] px-4 pt-4 pb-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-[4px] text-black dark:text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                    <label
                        htmlFor="password"
                        className={`absolute left-4 transition-all duration-200 pointer-events-none text-gray-500
                            ${password ? 'top-2 text-xs text-blue-600' : 'top-4 text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600'}`}
                    >
                        New Password
                    </label>
                </div>

                <div className="relative group">
                    <PasswordInput
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        required
                        className="peer w-full h-[54px] px-4 pt-4 pb-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-[4px] text-black dark:text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                    <label
                        htmlFor="confirmPassword"
                        className={`absolute left-4 transition-all duration-200 pointer-events-none text-gray-500
                            ${confirmPassword ? 'top-2 text-xs text-blue-600' : 'top-4 text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600'}`}
                    >
                        Confirm Password
                    </label>
                </div>

                <div className="flex justify-between items-center pt-2">
                    <Link to="/login" className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1.5 rounded-md text-[14px] font-medium transition-colors">
                        Back to sign in
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px] flex justify-center items-center h-[40px]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset"}
                    </button>
                </div>
            </form>
        </div>
    );
};
