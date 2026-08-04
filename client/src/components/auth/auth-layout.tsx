import { Outlet } from "react-router-dom";
export const AuthLayOut = () => {
    return (
        <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background">
            <Outlet />
        </div>
    );
};
