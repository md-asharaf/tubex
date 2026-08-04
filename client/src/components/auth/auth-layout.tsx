import { Outlet } from "react-router-dom";
export const AuthLayOut = () => {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Outlet />
        </div>
    );
};
