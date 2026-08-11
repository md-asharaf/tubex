import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { signUpFormValidation } from "@/validations";
import { IoLogoYoutube } from "react-icons/io";
import { authService } from "@/services/auth";
import { IRegisterForm } from "@/interfaces";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/root/password-input";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { useState } from "react";
export const SignUp = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const form = useForm<IRegisterForm>({
    resolver: zodResolver(signUpFormValidation),
    defaultValues: {
      fullname: "",
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: IRegisterForm) => {
    setLoading(true);
    try {
      await authService.register(values);
      toast.success("account created successfully");
      navigate("/login");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-[100dvh] items-center justify-center p-4 text-black dark:text-white bg-[#F9F9F9] dark:bg-[#0F0F0F]">
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
        <ArrowLeft className="w-6 h-6" />
      </button>
      <div className="bg-white dark:bg-[#212121] p-8 md:p-10 rounded-2xl md:shadow-lg w-full max-w-[450px] border border-gray-200 dark:border-white/10 md:border-transparent">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <IoLogoYoutube className="text-4xl text-red-600" />
            <div className="text-2xl font-bold ml-1 dark:text-white tracking-tight">
              TubeX
            </div>
          </div>
          <h2 className="text-2xl font-normal text-gray-900 dark:text-white">
            Create a TubeX Account
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Enter your details to sign up
          </p>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 w-full"
          >
            <FormField
              control={form.control}
              name="fullname"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Fullname"
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
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Username"
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
                      {...field}
                      className="bg-transparent border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-12 text-base px-4"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between pt-6">
              <Link
                to="/login"
                className="text-[#065FD4] font-medium text-sm hover:bg-blue-50 dark:hover:bg-white/10 px-4 py-2 rounded-full transition-colors"
              >
                Sign in instead
              </Link>
              <button
                type="submit"
                className="bg-[#065FD4] hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full transition-colors flex items-center justify-center min-w-[100px]"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Next"}
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

