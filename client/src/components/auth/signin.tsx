import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signInFormValidation } from "@/validations";
import { loginWithGoogle } from "@/lib/firebase";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { IoLogoYoutube } from "react-icons/io";
import { authService } from "@/services/auth";
import { ILoginForm } from "@/interfaces";
import { toast } from "sonner";
import { PasswordInput } from "@/components/root/password-input";
import { useDispatch } from "react-redux";
import { login, logout } from "@/store/reducers/auth";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { setLoginPopoverData } from "@/store/reducers/ui";

export const SignIn = ({ asModal = false }: { asModal?: boolean }) => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("r");
  const navigate = useNavigate();
  const form = useForm<ILoginForm>({
    resolver: zodResolver(signInFormValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onSubmit = async (values: ILoginForm) => {
    setLoading(true);
    try {
      const data = await authService.login(values);
      toast.success("Logged in successfully");
      dispatch(login(data.user));
      if (asModal) {
        dispatch(setLoginPopoverData({ open: false, message: "" }));
      } else {
        navigate(redirect || "/");
      }
    } catch (error) {
      dispatch(logout());
      toast.error(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const googleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const userGoogleData = await loginWithGoogle();
      const data = await authService.googleLogin(userGoogleData);
      toast.success("Logged in successfully");
      dispatch(login(data.user));
      if (asModal) {
        dispatch(setLoginPopoverData({ open: false, message: "" }));
      } else {
        navigate(redirect || "/");
      }
    } catch (error) {
      dispatch(logout());
      toast.error(error.message);
      console.error(error);
    } finally {
      setGoogleLoading(false);
    }
  };
  const content = (
    <div className={asModal ? "w-full pt-2" : "bg-white dark:bg-[#212121] p-8 md:p-10 rounded-2xl md:shadow-lg w-full max-w-[450px] border border-gray-200 dark:border-white/10 md:border-transparent"}>
      {!asModal && (
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <IoLogoYoutube className="text-4xl text-red-600" />
            <div className="text-2xl font-bold ml-1 dark:text-white tracking-tight">
              TubeX
            </div>
          </div>
          <h2 className="text-2xl font-normal text-gray-900 dark:text-white">
            Sign in
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            to continue to TubeX
          </p>
        </div>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5 w-full"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Email address"
                    {...field}
                    className="bg-transparent border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-12 text-base px-4"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PasswordInput
                    placeholder="Password"
                    className="bg-transparent border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-12 text-base px-4"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <div className="flex items-center justify-between pt-2">
            <Link
              to="/forgot-password"
              className="text-[#065FD4] font-medium text-sm hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="flex items-center justify-between pt-6">
            <Link
              to="/register"
              className="text-[#065FD4] font-medium text-sm hover:bg-blue-50 dark:hover:bg-white/10 px-4 py-2 rounded-full transition-colors"
            >
              Create account
            </Link>
            <button
              type="submit"
              className="bg-[#065FD4] hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full transition-colors flex items-center justify-center min-w-[100px]"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Next"
              )}
            </button>
          </div>
        </form>
      </Form>

      <div className="flex items-center my-6">
        <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
        <span className="mx-4 text-xs text-gray-500 dark:text-gray-400 font-medium">OR</span>
        <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
      </div>

      <div>
        <button
          className="w-full flex items-center justify-center bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 px-4 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors focus:outline-none"
          id="google-signin-btn"
          onClick={googleSignIn}
        >
          {!googleLoading ? (
            <div className="flex items-center justify-center">
              <img
                src="https://cdn-teams-slug.flaticon.com/google.jpg"
                className="w-5 h-5 mr-3 object-contain"
                alt="Google"
              />
              <span className="font-medium text-sm tracking-wide">Continue with Google</span>
            </div>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
        </button>
      </div>
    </div>
  );

  if (asModal) return content;

  return (
    <div className="flex w-full min-h-screen items-center justify-center p-4 text-black dark:text-white bg-[#F9F9F9] dark:bg-[#0F0F0F]">
      {content}
    </div>
  );
};
