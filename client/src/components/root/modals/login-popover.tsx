import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { setLoginPopoverData } from "@/store/reducers/ui";
import { ResponsiveModal } from "./responsive-modal";
import { SignIn } from "@/components/auth/signin";

export const LoginPopover: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { message, open } = useSelector(
    (state: RootState) => state.ui.loginPopoverData
  );

  const onOpenChange = (open: boolean) => {
    dispatch(setLoginPopoverData({ open, message: "" }));
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={message || "Sign In"}
      className="sm:max-w-[420px] w-full px-2"
    >
      <SignIn asModal={true} />
    </ResponsiveModal>
  );
};

export default LoginPopover;
