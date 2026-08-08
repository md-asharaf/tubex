import { useEffect } from "react";
import { MdOutlineSubscriptions } from "react-icons/md";
import { SiYoutubeshorts } from "react-icons/si";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { SubDrawer } from "./sub-drawer";
import { subService } from "@/services/subscription";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { GoHome } from "react-icons/go";
import { NavLink } from "react-router-dom";
import { ImYoutube } from "react-icons/im";
import { useWindowSize } from "@/hooks/use-window";
import { toast } from "sonner";
import { toggleMenu } from "@/store/reducers/ui";
import { ChevronRight, Menu } from "lucide-react";
import { Separator } from "../../ui/separator";

interface IChannel {
    fullname: string;
    username: string;
    avatar: string;
}

export const BigDrawer = () => {
    const dispatch = useDispatch();
    const userId = useSelector((state: RootState) => state.auth.userData?._id);
    const username = useSelector(
        (state: RootState) => state.auth.userData?.username
    );
    const { windowWidth } = useWindowSize();
    const {
        data: channels,
        isError,
        error,
        isLoading,
    } = useQuery({
        queryKey: ["channels", userId],
        queryFn: async (): Promise<IChannel[]> => {
            const data = await subService.getSubscribedChannels(userId);
            return data.subscribedChannels;
        },
        enabled: !!userId,
    });
    if (isError) {
        toast.error(error.message);
    }
    const options = [
        {
            name: "History",
            icon: (
                <div className="w-full h-full block">
                    <svg
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        height="24"
                        className="pointer-events-none w-full h-full block"
                        viewBox="0 0 24 24"
                        width="24"
                        focusable="false"
                    >
                        <g>
                            <path d="M14.97 16.95 10 13.87V7h2v5.76l4.03 2.49-1.06 1.7zM22 12c0 5.51-4.49 10-10 10S2 17.51 2 12h1c0 4.96 4.04 9 9 9s9-4.04 9-9-4.04-9-9-9C8.81 3 5.92 4.64 4.28 7.38c-.11.18-.22.37-.31.56L3.94 8H8v1H1.96V3h1v4.74c.04-.09.07-.17.11-.25.11-.22.23-.42.35-.63C5.22 3.86 8.51 2 12 2c5.51 0 10 4.49 10 10z"></path>
                        </g>
                    </svg>
                </div>
            ),
            route: `/watch-history`,
        },
        {
            name: "Playlists",
            icon: (
                <div className="w-full h-full block">
                    <svg
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        height="24"
                        viewBox="0 0 24 24"
                        width="24"
                        focusable="false"
                        className="pointer-events-none w-full h-full block"
                    >
                        <path d="M22 7H2v1h20V7zm-9 5H2v-1h11v1zm0 4H2v-1h11v1zm2 3v-8l7 4-7 4z"></path>
                    </svg>
                </div>
            ),
            route: `/playlists`,
        },
        {
            name: "Your videos",
            icon: (
                <div className="w-full h-full block">
                    <svg
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        height="24"
                        viewBox="0 0 24 24"
                        width="24"
                        focusable="false"
                        className="pointer-events-none w-full h-full block"
                    >
                        <path d="m10 8 6 4-6 4V8zm11-5v18H3V3h18zm-1 1H4v16h16V4z"></path>
                    </svg>
                </div>
            ),
            route: `/studio/${username}/content`,
        },
        {
            name: "Watch later",
            icon: (
                <div className="w-full h-full block">
                    <svg
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        height="24"
                        viewBox="0 0 24 24"
                        width="24"
                        focusable="false"
                        className="pointer-events-none w-full h-full block"
                    >
                        <path d="M14.97 16.95 10 13.87V7h2v5.76l4.03 2.49-1.06 1.7zM12 3c-4.96 0-9 4.04-9 9s4.04 9 9 9 9-4.04 9-9-4.04-9-9-9m0-1c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"></path>
                    </svg>
                </div>
            ),
            route: `/watch-later`,
        },
        {
            name: "Liked videos",
            icon: (
                <div className="w-full h-full block">
                    <svg
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        height="24"
                        viewBox="0 0 24 24"
                        width="24"
                        focusable="false"
                        className="pointer-events-none w-full h-full block"
                    >
                        <path d="M18.77,11h-4.23l1.52-4.94C16.38,5.03,15.54,4,14.38,4c-0.58,0-1.14,0.24-1.52,0.65L7,11H3v10h4h1h9.43 c1.06,0,1.98-0.67,2.19-1.61l1.34-6C21.23,12.15,20.18,11,18.77,11z M7,20H4v-8h3V20z M19.98,13.17l-1.34,6 C18.54,19.65,18.03,20,17.43,20H8v-8.61l5.6-6.06C13.79,5.12,14.08,5,14.38,5c0.26,0,0.5,0.11,0.63,0.3 c0.07,0.1,0.15,0.26,0.09,0.47l-1.52,4.94L13.18,12h1.35h4.23c0.41,0,0.8,0.17,1.03,0.46C19.92,12.61,20.05,12.86,19.98,13.17z"></path>
                    </svg>
                </div>
            ),
            route: `/liked-videos`,
        },
    ];

    const handleSidebarToggle = () => {
        if (isSmallScreen || isVideoPage) dispatch(toggleMenu(false));
    };

    const data = channels?.map((channel) => ({
        name: channel.fullname,
        avatar: channel.avatar,
        route: `/channel/${channel.username}`,
    }));
    const shortId = useSelector(
        (state: RootState) => state.short.randomShortId
    );
    const isSmallScreen = windowWidth < 1315;
    const isVideoPage = location.pathname.startsWith("/video");

    useEffect(() => {
        if (isSmallScreen || isVideoPage) {
            document.body.classList.add("overflow-hidden");
            return () => {
                document.body.classList.remove("overflow-hidden");
            };
        }
    }, [isSmallScreen, isVideoPage]);

    return (
        <div
            className={`${(isSmallScreen || isVideoPage) &&
                "fixed inset-0  dark:bg-black/50 bg-black/50 z-40"
                } w-full`}
            onClick={handleSidebarToggle}
        >
            <div
                className={`pl-6 w-60 overflow-y-auto h-full ${(isSmallScreen || isVideoPage) &&
                    "bg-[#FFFFFF] dark:bg-[#0F0F0F]"
                    }`}
            >
                {(isSmallScreen || isVideoPage) && (
                    <div className="pb-4 pl-2 pt-[18px] flex items-center gap-x-2 md:gap-x-4">
                        <Menu
                            strokeWidth={1.5}
                            className="text-4xl hover:bg-muted rounded-lg hidden sm:block"
                            onClick={() => {
                                dispatch(toggleMenu());
                            }}
                        />
                        <button
                            className="flex items-center hover:bg-transparent text-lg space-x-1"
                            onClick={() => (location.href = "/")}
                        >
                            <ImYoutube color="red" className="text-xl" />
                            <h1 className="font-bold">TubeX</h1>
                        </button>
                    </div>
                )}
                <div className="flex-col pr-6 pt-2">
                    <SidebarLink to="/" label="Home" icon={<GoHome />} />
                    <SidebarLink
                        to={`/short/${shortId}`}
                        label="Shorts"
                        icon={<SiYoutubeshorts />}
                    />
                    <SidebarLink
                        to="/subscriptions"
                        label="Subscriptions"
                        icon={<MdOutlineSubscriptions />}
                    />
                </div>
                {userId && (<>
                    <div className="space-y-1">
                        <Separator className="mt-3 mb-1" />
                        <NavLink
                            to={`/library?u=${username}`}

                        >
                            <p className="font-bold flex items-center gap-x-2 rounded-xl p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 mr-6">
                                <span className="text-lg">You</span>{" "}
                                <ChevronRight size={20} />
                            </p>
                        </NavLink>
                        <SubDrawer options={options} />
                    </div>
                    <Separator className="my-3" />
                    {isLoading ? (
                        <div className="space-y-2 mr-6">
                            {Array(4)
                                .fill(0)
                                .map((_, i) => (
                                    <Skeleton
                                        key={i}
                                        className="h-8 w-full"
                                    ></Skeleton>
                                ))}
                        </div>
                    ) : (
                        channels?.length > 0 && (
                            <>
                                <p className="font-bold">Subscriptions</p>
                                <SubDrawer options={data} />
                            </>
                        )
                    )}
                </>
                )}
            </div>
        </div>
    );
};

const SidebarLink = ({
    to,
    label,
    icon,
}: {
    to: string;
    label: string;
    icon: React.ReactNode;
}) => {
    return (
        <NavLink to={to}>
            {({ isActive }) => (
                <div
                    className={`flex gap-x-4 items-center rounded-xl p-2 ${isActive && "bg-zinc-200 dark:bg-zinc-800"
                        } hover:bg-zinc-200 dark:hover:bg-zinc-800`}
                >
                    <div className="text-xl">{icon}</div>
                    <span>{label}</span>
                </div>
            )}
        </NavLink>
    );
};
