import { Outlet } from "react-router-dom";
import { SidebarLayout } from "../sidebar/sidebar-layout";
import { ShortSection } from "./short-section";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { shortService } from "@/services/short";
import { IShortData } from "@/interfaces";
export const StudioShort = () => {
    const { id } = useParams();
    const { data: short, isLoading } = useQuery({
        queryKey: ["short", id],
        queryFn: async (): Promise<IShortData> => {
            const data = await shortService.singleShort(id);
            return data.short;
        },
        enabled: !!id,
    });
    if (isLoading) return null;
    return (
        <div className="flex min-h-[100dvh] pt-[4rem]">
            <SidebarLayout>
                <ShortSection
                    title={short.title}
                    thumbnail={short.thumbnail}
                    id={short._id}
                    route="shorts"
                />
            </SidebarLayout>
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};
