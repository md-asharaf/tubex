import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { notificationService } from "@/services/notification";
import {
  setNotifications,
  resetNotificationCount,
} from "@/store/reducers/notification";
import { IoNotificationsOutline } from "react-icons/io5";
import { formatDistanceToNowStrict } from "date-fns";
import { CheckCheck, EllipsisVertical, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useIntersection } from "@mantine/hooks";
import { AvatarImg } from "./avatar-image";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

export const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { notifications, newNotificationCount } = useSelector(
    (state: RootState) => state.notification
  );
  const [open, setOpen] = useState(notifications.map(() => false));
  const userId = useSelector((state: RootState) => state.auth.userData?._id);
  const [expandedMessages, setExpandedMessages] = useState({});
  const lastNotificationRef = useRef(null);
  const toggleExpand = (id: string) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const { mutate: deleteNotification } = useMutation({
    mutationFn: async (date: Date) => {
      await notificationService.deleteNotification(date);
    },
    onSuccess: (_, deletedDate) => {
      dispatch(
        setNotifications(
          notifications.filter((n) => n.createdAt !== deletedDate)
        )
      );
      toast.success("Notification deleted!");
    },
  });

  const { mutate: markAsRead } = useMutation({
    mutationFn: async (date: Date) => {
      await notificationService.markAsRead(date);
    },
    onSuccess: (_, date) => {
      dispatch(
        setNotifications(
          notifications.map((n) =>
            n.createdAt === date ? { ...n, read: true } : n
          )
        )
      );
    },
  });

  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["notifications", userId],
    queryFn: async ({ pageParam }) => {
      const data = await notificationService.getNotifications(pageParam);
      dispatch(
        setNotifications(
          pageParam === 1
            ? data.notifications.docs
            : [...notifications, ...data.notifications.docs]
        )
      );
      return data.notifications;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage ? allPages.length + 1 : undefined,
    enabled: false,
  });

  const onDropDownOpenChange = (open: boolean) => {
    if (open) {
      refetch();
      if (newNotificationCount > 0) dispatch(resetNotificationCount());
    }
  };
  const { ref, entry } = useIntersection({
    root: lastNotificationRef.current,
    threshold: 1,
  });
  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [entry]);

  if (isMobile) {
    return (
      <button
        className="p-1 rounded-full hover:bg-muted relative focus:outline-none"
        onClick={() => navigate('/notifications')}
      >
        <IoNotificationsOutline className="text-2xl" />
        {newNotificationCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center p-0.5">
            {newNotificationCount > 9 ? "9+" : newNotificationCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <DropdownMenu onOpenChange={onDropDownOpenChange}>
      <DropdownMenuTrigger className="focus:outline-none">
        <div className="p-1 rounded-full hover:bg-muted relative">
          <IoNotificationsOutline className="text-2xl" />
          {newNotificationCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center p-0.5">
              {newNotificationCount > 9 ? (
                <div className="flex items-center">
                  <span>9</span>
                  <span className="mb-1">+</span>
                </div>
              ) : (
                newNotificationCount
              )}
            </span>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        collisionPadding={40}
        className="w-[calc(100vw-24px)] sm:w-[480px] dark:bg-[#282828] p-0 mt-1 rounded-xl shadow-2xl"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-[#282828] rounded-t-xl">
          <DropdownMenuLabel className="text-lg font-bold mx-4 my-2">
            Notifications
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-muted-foreground opacity-40" />
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px] w-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-[75vh] sm:max-h-[550px] overflow-y-auto pb-4">
            {notifications
              .slice()
              .reverse()
              .map((notification, index) => {
                const isExpanded =
                  expandedMessages[
                  notification.createdAt.toString()
                  ] || false;
                const message = notification.message;
                const shortMessage =
                  message.length > 100
                    ? message.slice(0, 100) + "..."
                    : message;

                return (
                  <DropdownMenuItem
                    onClick={() =>
                      markAsRead(notification.createdAt)
                    }
                    key={index}
                    ref={
                      index === notifications.length - 1
                        ? ref
                        : null
                    }
                    className="flex items-start hover:bg-gray-100 dark:hover:bg-[#3E3E3E] space-x-2 sm:space-x-4 rounded-none py-4 px-3 sm:px-4 cursor-pointer transition-colors"
                  >
                    <div className="flex space-x-2 sm:space-x-3 w-[75%] items-start overflow-hidden">
                      <div className="flex items-center mt-1">
                        <div className="w-2 mr-1 sm:mr-2 flex justify-center">
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <AvatarImg
                          className="min-w-[52px] h-[52px] rounded-full"
                          avatar={
                            notification.creator
                              .avatar
                          }
                          fullname={
                            notification.creator
                              .fullname
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="break-all whitespace-pre-wrap">
                          {isExpanded
                            ? message
                            : shortMessage}
                          {message.length > 100 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(
                                  notification.createdAt.toString()
                                );
                              }}
                              className="text-blue-500 ml-1"
                            >
                              {isExpanded
                                ? "See less"
                                : "See more"}
                            </button>
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {formatDistanceToNowStrict(
                            new Date(
                              notification.createdAt
                            ),
                            { addSuffix: true }
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 w-[25%] justify-end items-start pt-1">
                      {(notification.video?.thumbnail || notification.short?.thumbnail || notification.post?.image) && (
                        <div className="w-[60px] sm:w-[86px] shrink-0">
                          <img
                            src={
                              notification.video?.thumbnail ||
                              notification.short?.thumbnail ||
                              notification.post?.image
                            }
                            alt="thumbnail"
                            className="h-auto w-full aspect-video object-cover rounded-md shadow-sm"
                          />
                        </div>
                      )}
                      <DropdownMenu
                        open={open?.[index]}
                        onOpenChange={(open) =>
                          setOpen((prev) => ({
                            ...prev,
                            [index]: open,
                          }))
                        }
                      >
                        <DropdownMenuTrigger className="p-0 focus:outline-none">
                          <div className="p-1 rounded-full hover:bg-muted">
                            <EllipsisVertical className="text-sm" />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpen((prev) => ({
                              ...prev,
                              [index]: false,
                            }));
                          }}
                          collisionPadding={120}
                          className="dark:bg-[#282828] p-0 rounded-lg shadow-lg space-y-2"
                        >
                          <button
                            className="flex space-x-2 hover:bg-muted-foreground w-full p-2"
                            onClick={() =>
                              deleteNotification(
                                notification.createdAt
                              )
                            }
                          >
                            <EyeOff className="h-5 w-5" />
                            <span>
                              Hide this
                              notification
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              markAsRead(
                                notification.createdAt
                              )
                            }
                            className="flex space-x-2 hover:bg-muted-foreground w-full p-2"
                          >
                            <CheckCheck className="h-5 w-5" />
                            <span>
                              Mark as read
                            </span>
                          </button>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            <div className="flex items-center justify-center">
              {isFetchingNextPage && (
                <Loader2 className="h-10 w-10 animate-spin" />
              )}
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
