import { Link } from "react-router-dom";
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "../../../ui/sidebar";
import { LogOutIcon } from "lucide-react";
import { Separator } from "../../../ui/separator";
export interface Option {
    title: string;
    url: string;
    icon: React.ElementType;
}
interface SidebarGroupProps {
    options: Option[];
    children: React.ReactNode;
}
export const SidebarGroupLayout = ({
    options,
    children,
}: SidebarGroupProps) => {
    const { state, setOpenMobile, isMobile } = useSidebar();
    const handleClick = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };
    return (
        <SidebarGroup>
            <SidebarMenu>
                {children}
                <Separator />
                {options.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            className={`${
                                state == "collapsed"
                                    ? "flex justify-center items-center mx-auto"
                                    : ""
                            }`}
                            size="lg"
                            tooltip={item.title}
                            asChild
                            isActive={false}
                            onClick={handleClick}
                        >
                            <Link
                                to={item.url}
                                className="w-full h-full flex items-center gap-6"
                            >
                                <div>
                                    <item.icon className="size-6" />
                                </div>
                                {state == "expanded" && (
                                    <span className="text-sm">
                                        {item.title}
                                    </span>
                                )}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
                <Separator />
                <SidebarMenuItem>
                    <SidebarMenuButton
                        className={`${
                            state == "collapsed"
                                ? "flex justify-center items-center mx-auto"
                                : ""
                        }`}
                        size="lg"
                        tooltip={"Exit Studio"}
                        asChild
                        isActive={false}
                        onClick={handleClick}
                    >
                        <Link
                            to="/"
                            className="w-full h-full flex items-center"
                        >
                            <div>
                                <LogOutIcon className="size-6" />
                            </div>
                            {state == "expanded" && (
                                <span className="text-sm">Exit Studio</span>
                            )}
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    );
};
