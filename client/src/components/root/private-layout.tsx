import { RootState } from "@/store/store";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Outlet } from "react-router-dom";
import { setLoginPopoverData } from "@/store/reducers/ui";

export const PrivateLayout: React.FC = () => {
  const userData = useSelector((state: RootState) => state.auth.userData);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userData) {
      dispatch(setLoginPopoverData({ open: true, message: "Sign In Required" }));
    }
  }, [userData, dispatch]);

  if (!userData) {
    return <div className="w-full min-h-[100dvh]" />;
  }

  return <Outlet />;
};
