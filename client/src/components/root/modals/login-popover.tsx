import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { setLoginPopoverData } from "@/store/reducers/ui";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import { login } from "@/store/reducers/auth";
import { authService } from "@/services/auth";
import { toast } from "sonner";
import { DialogClose } from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";

export const LoginPopover: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch: AppDispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const { message, open } = useSelector(
        (state: RootState) => state.ui.loginPopoverData
    );
    const requestRetryQueueRef = useRef<(() => Promise<any>)[]>([]);

    const handleLoginClick = async () => {
        setIsLoading(true);
        try {
            // Try to refresh token silently first
            const data = await authService.loginViaRefreshToken();
            dispatch(login(data.user));
            
            // Close popup first
            dispatch(setLoginPopoverData({ open: false, message: "" }));
            
            toast.success("Logged in successfully");
            
            // Queued requests will automatically retry via interceptor
        } catch (error) {
            // Token refresh failed - redirect to login page with current page as redirect target
            const redirectUrl = `${location.pathname}${location.search}`;
            const encodedRedirect = encodeURIComponent(redirectUrl);
            
            toast.error("Login failed. Redirecting to login page...");
            
            // Redirect with r parameter
            navigate(`/login?r=${encodedRedirect}`);
        } finally {
            setIsLoading(false);
        }
    };

    const onOpenChange = (open: boolean) => {
        if (!open) {
            // User closed popup without logging in
            // Redirect to login page with current page as redirect target
            const redirectUrl = `${location.pathname}${location.search}`;
            const encodedRedirect = encodeURIComponent(redirectUrl);
            navigate(`/login?r=${encodedRedirect}`);
        }
        dispatch(setLoginPopoverData({ open, message: "" }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-[90%] sm:max-w-sm mx-4 p-6 rounded-xl shadow-xl border bg-background transform transition-transform scale-100 m-0"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="flex flex-col items-center">
                    <Lock
                        className="h-12 w-12 text-primary mb-4 animate-bounce"
                        strokeWidth={1}
                    />
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        Login Required
                    </DialogTitle>
                </DialogHeader>
                <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-6">
                        {message || "Please log in to continue."}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            className="flex-1 bg-primary text-primary-foreground hover:bg-primary-hover py-3 text-lg font-medium disabled:opacity-50"
                            onClick={handleLoginClick}
                            disabled={isLoading}
                        >
                            {isLoading ? "Logging in..." : "Log In"}
                        </Button>
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                className="flex-1 py-3 text-lg font-medium"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LoginPopover;
