import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { setLoginPopoverData } from "@/store/reducers/ui";
import { ResponsiveModal } from "./responsive-modal";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
export const LoginPopover: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch: AppDispatch = useDispatch();
  const { message, open } = useSelector(
    (state: RootState) => state.ui.loginPopoverData
  );

  const handleLoginClick = () => {
    const redirectUrl = `${location.pathname}${location.search}`;
    const encodedRedirect = encodeURIComponent(redirectUrl);

    dispatch(setLoginPopoverData({ open: false, message: "" }));

    navigate(`/login?r=${encodedRedirect}`);
  };

  const onOpenChange = (open: boolean) => {
    dispatch(setLoginPopoverData({ open, message: "" }));
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Login Required"
      className="max-w-sm mx-auto"
    >
      <div className="flex flex-col items-center">
        <Lock
          className="h-12 w-12 text-primary mb-4 animate-bounce"
          strokeWidth={1}
        />
      </div>
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-6">
          {message || "Please log in to continue."}
        </p>
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary-hover py-3 text-lg font-medium"
          onClick={handleLoginClick}
        >
          Log In
        </Button>
      </div>
    </ResponsiveModal>
  );
};

export default LoginPopover;
