import { AuthLayOut } from "@/components/auth/auth-layout";
import { ForgotPassword } from "@/components/auth/forgot-password";
import { ResetPassword } from "@/components/auth/reset-password";
import { SignIn } from "@/components/auth/signin";
import { SignUp } from "@/components/auth/signup";
import { Route } from "react-router-dom";

export function AuthRoute() {
  return (<Route element={<AuthLayOut />}>
    <Route path="login" element={<SignIn />} />
    <Route path="register" element={<SignUp />} />
    <Route path="forgot-password" element={<ForgotPassword />} />
    <Route
      path="reset-password/:resetToken"
      element={<ResetPassword />}
    />
  </Route>);
}



