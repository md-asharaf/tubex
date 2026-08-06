import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IShortData } from "@/interfaces";
import { useDispatch } from "react-redux";
import { setOpenCard } from "@/store/reducers/short";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveModal } from "./responsive-modal";

export const DescriptionCard = ({
    short,
    likes,
}: {
    short: IShortData;
    likes: number;
}) => {
    const date = new Date(short.createdAt);
    const dispatch = useDispatch();
    const isMobile = useIsMobile();

    const Content = (
        <>
            <p className="whitespace-pre-wrap">{short.description}</p>
            <hr className="my-4" />
            <div className="flex items-center justify-around">
                <div className="text-center">
                    <p className="font-bold">{likes}</p>
                    <p className="text-muted-foreground text-sm">Likes</p>
                </div>
                <div className="text-center">
                    <p className="font-bold">{short.views}</p>
                    <p className="text-muted-foreground text-sm">Views</p>
                </div>
                <div className="text-center">
                    <p className="font-bold flex space-x-2 justify-center">
                        {`${date.getDate()} ${date.toLocaleString("en-US", {
                            month: "short",
                        })}`}
                    </p>
                    <p className="text-muted-foreground text-sm">
                        {date.getFullYear()}
                    </p>
                </div>
            </div>
        </>
    );

    if (isMobile) {
        return (
            <ResponsiveModal
                open={true}
                onOpenChange={(open) => {
                    if (!open) dispatch(setOpenCard(""));
                }}
                title="Description"
                className="h-[60vh]"
            >
                <div className="pb-8">
                    {Content}
                </div>
            </ResponsiveModal>
        );
    }

    return (
        <Card className="w-[512px] shadow-2xl">
            <CardHeader>
                <CardTitle className="flex justify-between items-center text-2xl px-2">
                    <div>Description</div>
                    <X
                        size={30}
                        strokeWidth={0.7}
                        onClick={() => dispatch(setOpenCard(""))}
                        className="cursor-pointer"
                    />
                </CardTitle>
            </CardHeader>
            <hr className="mb-4" />
            <CardContent className="h-[815px] overflow-y-auto">
                {Content}
            </CardContent>
        </Card>
    );
};
