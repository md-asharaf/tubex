import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ResponsiveModalProps {
  children: React.ReactNode;
  title?: string | React.ReactNode;
  open: boolean;
  className?: string;
  nested?: boolean;
  onOpenChange: (open: boolean) => void;
}
export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  children,
  title,
  open,
  onOpenChange,
  className = "",
  nested,
}) => {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} nested={nested}>
        <DrawerContent className={`flex flex-col dark:bg-[#282828] max-h-[80dvh] ${className}`}>
          {title ? (
            <>
              <DrawerHeader className="px-3 sm:px-4 pt-1 pb-3 shrink-0 flex flex-row items-center justify-between w-full">
                <div className="flex-1 text-left">
                  {typeof title === "string" ? (
                    <DrawerTitle className="font-bold text-[18px] text-foreground">
                      {title}
                    </DrawerTitle>
                  ) : (
                    <DrawerTitle asChild>
                      <div>{title}</div>
                    </DrawerTitle>
                  )}
                </div>
                <X
                  size={30}
                  strokeWidth={0.7}
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer shrink-0 ml-4"
                />
              </DrawerHeader>
              <Separator />
            </>
          ) : (
            <DrawerTitle className="sr-only">Modal</DrawerTitle>
          )}
          <div className="flex-1 overflow-y-auto no-scrollbar px-3 sm:px-4 pt-3 pb-4">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`p-0 flex flex-col max-h-[85vh] shadow-md dark:bg-[#282828] ${className}`}
      >
        {title ? (
          <>
            <DialogHeader className="px-4 py-3 shrink-0 flex flex-row items-center justify-between w-full">
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <Separator />
          </>
        ) : (
          <DialogTitle className="sr-only">Modal</DialogTitle>
        )}
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};
