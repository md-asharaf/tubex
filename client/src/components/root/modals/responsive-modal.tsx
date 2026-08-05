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
import { Button } from "@/components/ui/button";

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
        <DrawerContent className={`px-3 sm:px-4 max-h-[70dvh] flex flex-col dark:bg-[#282828] ${className}`}>
          {title ? (
            <DrawerHeader className="shrink-0 text-left px-0 pb-2 mx-3 sm:mx-4 mb-2">
              {typeof title === "string" ? (
                <DrawerTitle className="flex items-center justify-between w-full font-bold text-[18px] text-foreground">
                  <span>{title}</span>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground" onClick={() => onOpenChange(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </DrawerTitle>
              ) : (
                <DrawerTitle>{title}</DrawerTitle>
              )}
            </DrawerHeader>
          ) : (
            <DrawerTitle className="sr-only">Modal</DrawerTitle>
          )}
          <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`p-4 flex-1 overflow-y-auto shadow-md dark:bg-[#282828] ${className}`}
      >
        {title ? (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        ) : (
          <DialogTitle className="sr-only">Modal</DialogTitle>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};
