import { Outlet, useParams, Navigate } from "react-router-dom";
import { IUser } from "@/interfaces";
import { userService } from "@/services/user";
import { useSelector } from "react-redux";
import DefaultCoverImage from "@/assets/images/coverImage.jpg";
import { videoService } from "@/services/video";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { subService } from "@/services/subscription";
import { RootState } from "@/store/store";
import { AvatarImg } from "@/components/root/avatar-image";
import NavigationMenu from "@/components/root/nav-menu";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { queryClient } from "@/main";

export const Channel = () => {
    const userData = useSelector((state: RootState) => state.auth.userData);
    const userId = userData?._id;
    const { username } = useParams();
    
    if (!username || username === "undefined" || username === "null") {
        return <Navigate to="/" replace />;
    }

    const { data: userDetails } = useQuery({
        queryKey: ["user-details", username],
        queryFn: async (): Promise<{
            user: IUser;
            subscribersCount: number;
        }> => {
            const data = await userService.getUserChannel(username);
            return data.channel;
        },
        enabled: !!username,
    });
    const channelId = userDetails?.user?._id;
    const { data: isSubscribed } = useQuery({
        queryKey: ["is-subscribed", channelId, userId],
        queryFn: async (): Promise<boolean> => {
            const data = await subService.isChannelSubscribed(
                userDetails?.user?._id
            );
            return data.isSubscribed;
        },
        enabled: !!channelId && !!userId,
    });

    const { data: videosCount, isLoading } = useQuery({
        queryKey: ["videos", userDetails?.user?._id],
        queryFn: async (): Promise<number> => {
            const data = await videoService.videosCount(userDetails?.user?._id);
            return data.videosCount;
        },
        enabled: !!userDetails?.user,
    });

    const { mutate: toggleSubscription } = useMutation({
        mutationFn: async () => {
            await subService.toggleSubscription(userDetails?.user?._id);
        },
        onMutate: () => {
            queryClient.cancelQueries({
                queryKey: ["is-subscribed", channelId, userId],
            });
            queryClient.cancelQueries({
                queryKey: ["subscribers-count", channelId],
            });
            queryClient.setQueryData(
                ["is-subscribed", channelId, userId],
                (prevData: boolean) => !prevData
            );
            queryClient.setQueryData(
                ["subscribers-count", channelId],
                (prevData: number) =>
                    isSubscribed ? prevData - 1 : prevData + 1
            );
        },
        onError: () => {
            queryClient.cancelQueries({
                queryKey: ["is-subscribed", channelId, userId],
            });
            queryClient.cancelQueries({
                queryKey: ["subscribers-count", channelId],
            });
            queryClient.setQueryData(
                ["is-subscribed", channelId, userId],
                (prevData: boolean) => !prevData
            );
            queryClient.setQueryData(
                ["subscribers-count", channelId],
                (prevData: number) =>
                    isSubscribed ? prevData - 1 : prevData + 1
            );
        },
        onSuccess: () => {
            if (isSubscribed) {
                toast.success('Subscription added')
            } else {
                toast.success('Subscription removed')
            }
        }
    });
    const items = [
        { name: "Home", path: "" },
        { name: "Videos", path: "videos" },
        { name: "Shorts", path: "shorts" },
        { name: "Playlists", path: "playlists" },
        { name: "Posts", path: "posts" },
    ];
    if (isLoading) {
        return (
            <div className="flex justify-center items-center w-full min-h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    }
    return (
        <div className="space-y-4 w-full relative">
            <img
                className="w-full h-24 md:h-32 lg:h-40 object-cover 2xl:h-48 rounded-lg"
                src={userDetails?.user?.coverImage || DefaultCoverImage}
                loading="lazy"
                alt="Cover"
            />
            <div className="flex space-x-2 sm:space-x-6">
                <AvatarImg
                    className="rounded-full h-24 w-24 sm:h-32 sm:w-32 object-cover lg:h-40 lg:w-40"
                    avatar={userDetails?.user?.avatar}
                    fullname={userDetails?.user?.fullname}
                />
                <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold">
                        {userDetails?.user?.fullname}
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">{`@${userDetails?.user?.username
                        } • ${userDetails?.subscribersCount} subscribers • ${videosCount || 0
                        } videos`}</p>
                    {userData?.username !== username && (
                        <div className="flex space-x-2">
                            <Button
                                variant={isSubscribed ? "secondary" : "default"}
                                onClick={() => toggleSubscription()}
                                className="rounded-full"
                            >
                                {isSubscribed ? "Unsubscribe" : "Subscribe"}
                            </Button>
                            <Button variant="outline" className="rounded-full">
                                Join
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            <NavigationMenu data={items} />
            <Outlet />
        </div>
    );
};
