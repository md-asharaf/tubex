import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/root/password-input";
import { toast } from "sonner";
import { userService } from "@/services/user";
import { login } from "@/store/reducers/auth";
import { Loader2, Camera } from "lucide-react";
import { uploadService } from "@/services/upload";
import { uploadToPresignedUrl } from "@/lib/upload";
import { v4 as uuid } from "uuid";
import { AvatarImg } from "./avatar-image";

const accountDetailsSchema = z.object({
  fullname: z.string().min(2, "Fullname is too short"),
  email: z.string().email("Invalid email address"),
});

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const setPasswordSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const Account = () => {
  const dispatch = useDispatch();
  const userData = useSelector((state: RootState) => state.auth.userData);
  
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [requestOtpLoading, setRequestOtpLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  const [avatarPreview, setAvatarPreview] = useState(userData?.avatar);
  const [coverPreview, setCoverPreview] = useState(userData?.coverImage);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const detailsForm = useForm({
    resolver: zodResolver(accountDetailsSchema),
    defaultValues: {
      fullname: userData?.fullname || "",
      email: userData?.email || "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const setPasswordForm = useForm({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (userData) {
      detailsForm.reset({
        fullname: userData.fullname,
        email: userData.email,
      });
      setAvatarPreview(userData.avatar);
      setCoverPreview(userData.coverImage);
    }
  }, [userData, detailsForm]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const onDetailsSubmit = async (values: z.infer<typeof accountDetailsSchema>) => {
    setDetailsLoading(true);
    try {
      let avatarUrl = userData?.avatar || "";
      let coverUrl = userData?.coverImage || "";
      const BUCKET = process.env.INPUT_BUCKET;

      if (avatarFile) {
        const extension = avatarFile.name.split(".").pop();
        const fileKey = `uploads/avatars/${uuid()}.${extension}`;
        const { url } = await uploadService.getPutObjectPresignedUrl(
          fileKey,
          avatarFile.type
        );
        await uploadToPresignedUrl(url, avatarFile, null, () => {});
        avatarUrl = `https://${BUCKET}.s3.ap-south-1.amazonaws.com/${fileKey}`;
      }

      if (coverFile) {
        const extension = coverFile.name.split(".").pop();
        const fileKey = `uploads/covers/${uuid()}.${extension}`;
        const { url } = await uploadService.getPutObjectPresignedUrl(
          fileKey,
          coverFile.type
        );
        await uploadToPresignedUrl(url, coverFile, null, () => {});
        coverUrl = `https://${BUCKET}.s3.ap-south-1.amazonaws.com/${fileKey}`;
      }

      await userService.updateAccountDetails({
        ...values,
        avatar: avatarUrl,
        coverImage: coverUrl,
      });

      // Update Redux state
      const userRes = await userService.getCurrentUser();
      dispatch(login(userRes.user));

      toast.success("Account details updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setPasswordLoading(true);
    try {
      await userService.changePassword(values);
      toast.success("Password changed successfully");
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setRequestOtpLoading(true);
    try {
      await userService.requestSetPasswordOtp();
      toast.success("OTP sent to your email");
      setIsOtpSent(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setRequestOtpLoading(false);
    }
  };

  const onSetPasswordSubmit = async (values: z.infer<typeof setPasswordSchema>) => {
    setPasswordLoading(true);
    try {
      await userService.setPasswordWithOtp(values);
      toast.success("Password set successfully");
      setPasswordForm.reset();
      setIsOtpSent(false);
      // Fetch user again to update hasPassword state
      const userRes = await userService.getCurrentUser();
      dispatch(login(userRes.user));
    } catch (error: any) {
      toast.error(error.message || "Failed to set password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!userData) return null;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 mt-16 sm:mt-0">
      <h1 className="text-2xl font-bold mb-8">Manage Your Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Profile Details</h2>
            
            <div className="mb-8">
              <label className="block text-sm font-medium mb-3">Cover Image</label>
              <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden group">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-800" />
                )}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="text-white w-8 h-8" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </label>
              </div>
            </div>

            <div className="mb-8 flex items-center gap-6">
              <div className="relative group">
                <AvatarImg 
                  fullname={userData.fullname} 
                  avatar={avatarPreview} 
                  className="w-24 h-24 text-2xl" 
                />
                <label className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="text-white w-8 h-8" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{userData.fullname}</h3>
                <p className="text-muted-foreground">@{userData.username}</p>
              </div>
            </div>

            <Form {...detailsForm}>
              <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)} className="space-y-4">
                <FormField
                  control={detailsForm.control}
                  name="fullname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={detailsForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={detailsLoading} className="w-full">
                  {detailsLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Save Details
                </Button>
              </form>
            </Form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            {userData.hasPassword ? (
              <>
                <h2 className="text-xl font-semibold mb-6">Change Password</h2>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="Enter current password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="Enter new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="Confirm new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" variant="secondary" disabled={passwordLoading} className="w-full">
                      {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                      Update Password
                    </Button>
                  </form>
                </Form>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-6">Set Password</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't set a password yet. Set one now to login without Google.
                </p>
                {!isOtpSent ? (
                  <Button 
                    onClick={handleRequestOtp} 
                    disabled={requestOtpLoading} 
                    className="w-full"
                  >
                    {requestOtpLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Request OTP to Email
                  </Button>
                ) : (
                  <Form {...setPasswordForm}>
                    <form onSubmit={setPasswordForm.handleSubmit(onSetPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={setPasswordForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verification Code (OTP)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter 6-digit OTP" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={setPasswordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <PasswordInput placeholder="Enter new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={setPasswordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <PasswordInput placeholder="Confirm new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" variant="secondary" disabled={passwordLoading} className="w-full">
                        {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                        Set Password
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setIsOtpSent(false)} className="w-full mt-2">
                        Cancel
                      </Button>
                    </form>
                  </Form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
