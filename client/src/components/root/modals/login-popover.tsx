import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { setLoginPopoverData } from "@/store/reducers/ui";
import { ResponsiveModal } from "./responsive-modal";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
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
      className="max-w-[360px] mx-auto rounded-2xl"
    >
      <div className="flex flex-col items-start w-full mt-2">
        <h2 className="text-[18px] sm:text-[20px] font-medium text-foreground mb-3 tracking-tight">
          Want to {message ? message.toLowerCase() : "perform this action"}?
        </h2>
        <p className="text-[15px] text-muted-foreground mb-8">
          Sign in to make your opinion count.
        </p>
        <div className="flex justify-end w-full">
          <Button
            className="rounded-full px-5 h-9 font-medium text-blue-600 dark:text-[#3EA6FF] bg-transparent hover:bg-blue-50 dark:hover:bg-[#263850]"
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
