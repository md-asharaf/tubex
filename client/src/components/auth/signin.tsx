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

export const SignIn = () => {
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
      navigate(redirect || "/");
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
      navigate(redirect || "/");
    } catch (error) {
      dispatch(logout());
      toast.error(error.message);
      console.error(error);
    } finally {
      setGoogleLoading(false);
    }
  };
  return (
    <div className="flex w-full items-center justify-center mx-2 text-black">
      <div className="bg-white p-6 md:p-8 rounded-lg z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center space-x-1 items-center">
            <IoLogoYoutube className="text-3xl" />
            <div className="text-red-500 font-bold text-pretty">
              TubeX
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Log In
          </h2>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 w-full"
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
                      className="bg-white"
                    />
                  </FormControl>
                  <FormMessage />
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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-2">
              <Link
                to="/forgot-password"
                className="text-blue-500 text-sm hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : (
                "Log In"
              )}
            </button>
          </form>
        </Form>
        <div className="text-center mt-2">OR</div>
        <div className="mt-2">
          <button
            className="w-80 flex items-center justify-center bg-white border-2 border-gray-300 text-gray-700 py-1 px-6 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="google-signin-btn"
            onClick={googleSignIn}
          >
            {!googleLoading ? <div className="flex space-x-2 justify-center items-center">
              <img
                src="https://cdn-teams-slug.flaticon.com/google.jpg"
                className={`w-8 h-8 mr-3`}
              />
              <span className="text-lg">Continue with Google</span>
            </div> : <Loader2 className="h-6 w-6 animate-spin" />}
          </button>
        </div>

        <div className="text-center text-sm mt-6">
          <p>Don't have an account?</p>
          <Link
            to="/register"
            className="text-blue-500 hover:underline"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};

