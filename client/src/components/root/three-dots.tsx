import { EllipsisVertical } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ThreeDotContent } from "./three-dot-content";
import { useState } from "react";

interface IThreeDots {
    task?: {
        title: string;
        handler: () => void;
    };
    videoId: string;
}
export const ThreeDots = ({ videoId, task = null }: IThreeDots) => {
    const [open,setOpen] = useState(false);
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <EllipsisVertical />
                </PopoverTrigger>
                <PopoverContent
                    collisionPadding={10}
                    className="py-2 px-0 w-full rounded-xl shadow-lg bg-white dark:bg-[#212121] border-none text-sm"
                    onClick={()=>setOpen(false)}
                >
                    <ThreeDotContent videoId={videoId} task={task} />
                </PopoverContent>
            </Popover>
        </div>
    );
};
