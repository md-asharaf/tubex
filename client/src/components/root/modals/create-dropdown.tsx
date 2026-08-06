import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleVideoModal } from "@/store/reducers/ui";
import { RootState } from "@/store/store";
import {
  ListPlusIcon,
  Plus,
  SquarePenIcon,
  SquarePlayIcon,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ResponsiveModal } from "@/components/root/modals/responsive-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface CreateDropdownProps {
  isPlaylist?: boolean;
}
export const CreateDropdown = ({ isPlaylist = false }: CreateDropdownProps) => {
  const { username } =
    useSelector((state: RootState) => state.auth.userData) || {};
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const onVideoUploadClick = () => {
    setOpen(false);
    if (!window.location.pathname.startsWith("/studio"))
      navigate(`/studio/${username}/content`);
    dispatch(toggleVideoModal());
  }
  const onCreatePostClick = () => {
    setOpen(false);
    navigate(`/channel/${username}/posts`)
  }
  const onNewPlaylistClick = () => {
    setOpen(false);
  }

  const triggerButton = (
    <div className="flex items-center justify-center h-10 w-10 sm:h-10 sm:w-auto sm:px-4 sm:bg-secondary sm:hover:bg-gray-200 sm:dark:hover:bg-[#272727] rounded-full transition-colors cursor-pointer">
      <Plus className="w-6 h-6 sm:w-5 sm:h-5" strokeWidth={1.5} />
      <span className="hidden sm:inline-block ml-1 font-medium">Create</span>
    </div>
  );

  const MenuItems = () => (
    <>
      <div
        onClick={onVideoUploadClick}
        className="flex items-center gap-4 rounded-none px-4 py-3 cursor-pointer hover:bg-muted [&_svg]:size-6"
      >
        <SquarePlayIcon strokeWidth={1.2} /> <span>Upload video</span>
      </div>
      <div
        onClick={onCreatePostClick}
        className="flex items-center gap-4 rounded-none px-4 py-3 cursor-pointer hover:bg-muted [&_svg]:size-6"
      >
        <SquarePenIcon strokeWidth={1.2} /> <span>Create post</span>
      </div>
      {isPlaylist && (
        <div
          onClick={onNewPlaylistClick}
          className="flex items-center gap-4 rounded-none px-4 py-3 cursor-pointer hover:bg-muted [&_svg]:size-6"
        >
          <ListPlusIcon strokeWidth={1.2} /> <span>New playlist</span>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        <div onClick={() => setOpen(true)}>
          {triggerButton}
        </div>
        <ResponsiveModal open={open} onOpenChange={setOpen} title="Create" className="pb-2">
          <div className="flex flex-col -mx-3 sm:-mx-4">
            <MenuItems />
          </div>
        </ResponsiveModal>
      </>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="focus:outline-none" asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0 py-2 m-0 w-48">
        <MenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
