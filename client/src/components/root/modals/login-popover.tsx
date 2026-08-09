import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { setLoginPopoverData } from "@/store/reducers/ui";
import { ResponsiveModal } from "./responsive-modal";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";
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
      title={message || "Sign In Required"}
      className="sm:max-w-[360px] w-full"
    >
      <div className="flex flex-col items-center w-full text-center gap-5 py-6 sm:py-8 px-1">
        <div className="w-14 h-14 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0">
          <LogIn
            className="w-7 h-7 text-blue-600 dark:text-[#3EA6FF]"
            strokeWidth={2}
          />
        </div>
        <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[260px]">
          Sign in to perform this action.
        </p>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
          >
            Not now
          </button>
          <Button
            className="rounded-full px-8 h-10 w-full sm:w-auto font-medium text-white bg-blue-600 hover:bg-blue-700"
            onClick={handleLoginClick}
          >
            Sign in
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default LoginPopover;
