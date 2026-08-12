import { AlignLeft, Captions } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setOpenCard } from "@/store/reducers/short";
import { toast } from "sonner";
import { setSaveToPlaylistDialog, setLoginPopoverData } from "@/store/reducers/ui";

export const ShortPopoverContent = ({ shortId, playerRef }) => {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.auth.userData?._id);
  const toggleCaption = () => {
    if (playerRef.current) {
      playerRef.current.toggleCaptions();
      toast.success(
        `Captions/CC turned ${playerRef.current.captions.active ? "on" : "off"
        }`
      );
    }
  };
  return (
    <ul className="space-y-2">
      <li
        className="flex items-center space-x-2 cursor-pointer dark:hover:bg-[#535353] hover:bg-[#E5E5E5] py-2 px-4"
        onClick={() => {
          dispatch(setOpenCard("description"));
        }}
      >
        <AlignLeft className="h-5 w-5" />
        <span>Description</span>
      </li>
      <li
        className="cursor-pointer dark:hover:bg-[#535353] hover:bg-[#E5E5E5]"
        onClick={() => {
          if (!userId) {
            dispatch(setLoginPopoverData({ open: true, message: "Sign in to save." }));
            return;
          }
          dispatch(
            setSaveToPlaylistDialog({ id: shortId, open: true })
          );
        }}
      >
        <div className="flex items-center space-x-2 py-2 px-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 3v16l7-3 7 3V3H5z"
            />
          </svg>
          <span>Save to playlist</span>
        </div>
      </li>
      <li
        className="flex items-center space-x-2 cursor-pointer py-2 px-4 dark:hover:bg-[#535353] hover:bg-[#E5E5E5]"
        onClick={toggleCaption}
      >
        <Captions className="w-5 h-5" />
        <span>Captions</span>
      </li>
    </ul>
  );
};
