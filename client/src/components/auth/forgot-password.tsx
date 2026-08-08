import { useState } from "react";
import { Link } from "react-router-dom";
import { userService } from "@/services/user";
import { authService } from "@/services/auth";
import { AvatarImg } from "@/components/root/avatar-image";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const ForgotPassword = () => {
    const [searchText, setSearchText] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchText.trim()) return;
        
        setSearchLoading(true);
        setUsers([]);
        setSelectedUserId(null);
        try {
            const data = await userService.getUsersBySearchText(searchText);
            setUsers(data.users);
        } catch (error: any) {
            toast.error(error.message);
            console.error(error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };

    const handleResetRequest = async () => {
        if (!selectedUserId) return;
        setLoading(true);
        try {
            const selectedUser = users.find((user) => user._id === selectedUserId);
            if (!selectedUser) throw new Error("No user selected");
            await authService.sendResetLinkOnEmail(selectedUser.email);
            toast.info("Password reset link sent to your email");
        } catch (error: any) {
            toast.error(error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[450px] p-8 mx-4 bg-white dark:bg-[#0f0f0f] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex flex-col items-center mb-8">
                <div className="flex items-center gap-1 mb-4">
                    <img src="/logo.png" alt="TubeX Logo" className="w-8 h-8" />
                    <span className="text-xl font-semibold tracking-tight text-black dark:text-white">TubeX</span>
                </div>
                <h2 className="text-[24px] font-normal text-black dark:text-white">Account recovery</h2>
                <p className="text-black/70 dark:text-white/70 mt-3 text-[15px] text-center">
                    Recover your TubeX Account
                </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-6">
                <div className="relative group">
                    <input
                        type="text"
                        id="searchText"
                        value={searchText}
                        onChange={handleSearchChange}
                        required
                        className="peer w-full h-[54px] px-4 pt-4 pb-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-[4px] text-black dark:text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                    <label
                        htmlFor="searchText"
                        className={`absolute left-4 transition-all duration-200 pointer-events-none text-gray-500
                            ${searchText ? 'top-2 text-xs text-blue-600' : 'top-4 text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600'}`}
                    >
                        Email or phone
                    </label>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                    <Link to="/login" className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1.5 rounded-md text-[14px] font-medium transition-colors">
                        Back to sign in
                    </Link>
                    <button
                        type="submit"
                        disabled={searchLoading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px] flex justify-center items-center h-[40px]"
                    >
                        {searchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Next"}
                    </button>
                </div>
            </form>

            {users?.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                    <h3 className="text-[15px] font-medium mb-4 text-black dark:text-white">Select your account</h3>
                    <div className="space-y-2">
                        {users.map((user) => (
                            <button
                                key={user._id}
                                onClick={() => setSelectedUserId(user._id)}
                                className={`w-full flex items-center p-3 rounded-xl transition-colors border ${
                                    selectedUserId === user._id 
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                                        : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                <AvatarImg
                                    fullname={user.fullname}
                                    avatar={user.avatar}
                                    className="h-10 w-10 mr-4"
                                />
                                <div className="flex flex-col items-start">
                                    <span className="font-medium text-[15px] text-black dark:text-white">{user.fullname}</span>
                                    <span className="text-[13px] text-gray-500">@{user.username}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {selectedUserId && (
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleResetRequest}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center min-w-[180px] h-[40px]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
                    </button>
                </div>
            )}
        </div>
    );
};
