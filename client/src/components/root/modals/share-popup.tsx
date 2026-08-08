import { useRef } from "react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setShareModalData } from "@/store/reducers/ui";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "./responsive-modal";
import { FaWhatsapp, FaXTwitter, FaFacebookF, FaRedditAlien, FaEnvelope } from "react-icons/fa6";

export const SharePopup = () => {
  const dispatch = useDispatch();
  const { id, open, type, parentId, parentType } = useSelector(
    (state: RootState) => state.ui.shareModalData
  );
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://tubex.asharaf.tech";

  let sharePath = "";
  if (type === "comment" || type === "reply") {
      sharePath = [parentType, parentId].filter(Boolean).join("/") + `?${type}Id=${id}`;
  } else {
      sharePath = [type, id].filter(Boolean).join("/");
  }
  
  const videoLink = sharePath ? `${origin}/${sharePath}` : origin;

  const shareLinks = [
    { name: "WhatsApp", icon: FaWhatsapp, color: "bg-[#25D366]", href: `whatsapp://send?text=${encodeURIComponent(videoLink)}` },
    { name: "X", icon: FaXTwitter, color: "bg-black dark:bg-white dark:text-black", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(videoLink)}` },
    { name: "Facebook", icon: FaFacebookF, color: "bg-[#1877F2]", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoLink)}` },
    { name: "Reddit", icon: FaRedditAlien, color: "bg-[#FF4500]", href: `https://reddit.com/submit?url=${encodeURIComponent(videoLink)}` },
    { name: "Email", icon: FaEnvelope, color: "bg-gray-500", href: `mailto:?body=${encodeURIComponent(videoLink)}` },
  ];

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
      <div className="flex flex-col space-y-6 w-full">
        {/* Social Icons Row */}
        <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2 pt-2 px-1">
          {shareLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center space-y-2 shrink-0 group"
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${link.color} transition-transform group-hover:scale-105`}
              >
                <link.icon className="w-7 h-7" />
              </div>
              <span className="text-xs font-medium text-foreground">
                {link.name}
              </span>
            </a>
          ))}
        </div>

        {/* Copy Link Input */}
        <div className="flex space-x-2 p-1.5 items-center rounded-xl bg-gray-100 dark:bg-[#282828] border border-transparent dark:border-gray-700 focus-within:border-blue-500 focus-within:dark:border-blue-500 transition-colors">
          <input
            className="w-full text-sm px-3 bg-transparent focus:outline-none text-foreground"
            ref={ref}
            value={videoLink}
            readOnly
          />
          <Button
            onClick={handleCopyToClipboard}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium shrink-0 h-9 px-5"
          >
            Copy
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
};
