import { useRef } from "react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setShareModalData } from "@/store/reducers/ui";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "./responsive-modal";

export const SharePopup = () => {
  const dispatch = useDispatch();
  const { id, open, type } = useSelector(
    (state: RootState) => state.ui.shareModalData
  );
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://tubex.asharaf.tech";
  const sharePath = [type, id].filter(Boolean).join("/");
  const videoLink = sharePath ? `${origin}/${sharePath}` : origin;
  const ref = useRef<HTMLInputElement | null>(null);
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(videoLink);
    toast.success("Link copied to clipboard!");
    try {
        if (ref.current) {
            ref.current.select();
          }
    } catch (error) {
        console.log(error)
    }
  };
  const onOpenChange = (open: boolean) => {
    dispatch(setShareModalData({ open, id: "", type: "" }));
  };
  return (
    <ResponsiveModal
      title={`Share ${type}`}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex space-x-2 p-1 items-center rounded-lg border border-gray-300 dark:border-gray-600">
        <input className="w-full text-sm p-1 bg-transparent focus:outline-none" ref={ref} value={videoLink} readOnly />
        <Button
        size="sm"
          onClick={handleCopyToClipboard}
          className="rounded-full bg-blue-400"
        >
          Copy
        </Button>
      </div>
    </ResponsiveModal>
  );
};
