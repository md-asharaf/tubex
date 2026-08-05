import { toggleMenu } from "@/store/reducers/ui";
import { Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { IShortData } from "@/interfaces";
import { useQuery } from "@tanstack/react-query";
import { shortService } from "@/services/short";
import { useDispatch } from "react-redux";
import { ShortCard } from "@/components/root/short/short-card";
import { useRef } from "react";

export const ChannelShorts = () => {
    const playerRef = useRef(null);
    const dispatch = useDispatch();
    const { username } = useParams();
    const { data: shorts, isLoading } = useQuery({
        queryKey: ["shorts", username],
        queryFn: async (): Promise<IShortData[]> => {
            const data = await shortService.allShortsByUser(username);
            return data.shorts;
        },
        enabled: !!username,
    });
    return (
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {isLoading ? (
                <div className="flex justify-center items-center w-full min-h-[50vh] col-span-full">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
            ) : (
                shorts?.length > 0 ? shorts?.map((short, index) => (
                    <Link
                        to={`/short/${short._id}`}
                        onClick={() => dispatch(toggleMenu())}
                        key={index}
                        className="rounded-lg"
                    >
                        <ShortCard short={short} playerRef={playerRef} />
                    </Link>
                )) : "No shorts"
            )}
        </div>
    );
};
