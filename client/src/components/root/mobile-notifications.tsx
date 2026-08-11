import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { notificationService } from "@/services/notification";
import {
  setNotifications,
  resetNotificationCount,
} from "@/store/reducers/notification";
import { getRelativeShortTime } from "@/lib/time";
import { ArrowLeft, Search, EllipsisVertical, Loader2, CheckCheck, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useIntersection } from "@mantine/hooks";
import { AvatarImg } from "./avatar-image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const MobileNotifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, newNotificationCount } = useSelector(
    (state: RootState) => state.notification
  );
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: number]: boolean }>({});
  const userId = useSelector((state: RootState) => state.auth.userData?._id);
  const lastNotificationRef = useRef(null);

  useEffect(() => {
    if (newNotificationCount > 0) dispatch(resetNotificationCount());
  }, [newNotificationCount, dispatch]);

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
      toast.success("Notification deleted");
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

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.createdAt);
    const state = { commentId: notification.comment, replyId: notification.reply };
    if (notification.video?._id) {
      navigate(`/video/${notification.video._id}`, { state });
    } else if (notification.short?._id) {
      navigate(`/short/${notification.short._id}`, { state });
    } else if (notification.post?._id) {
      navigate(`/post/${notification.post._id}`, { state });
    } else if (notification.creator?.username) {
      navigate(`/channel/${notification.creator.username}`);
    }
  };

  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
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
  });

  const { ref, entry } = useIntersection({
    root: lastNotificationRef.current,
    threshold: 1,
  });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [entry, hasNextPage, fetchNextPage]);

  const todayNotifications = [];
  const olderNotifications = [];

  const now = new Date();
  [...notifications].reverse().forEach((n) => {
    const date = new Date(n.createdAt);
    if (now.getTime() - date.getTime() < 24 * 60 * 60 * 1000) {
      todayNotifications.push(n);
    } else {
      olderNotifications.push(n);
    }
  });

  const renderNotificationItem = (notification: any, index: number, isLast: boolean) => {
    const message = notification.message;
    const timeAgo = getRelativeShortTime(new Date(notification.createdAt));

    return (
      <div
        key={index}
        ref={isLast ? ref : null}
        onClick={() => handleNotificationClick(notification)}
        className="flex items-start py-4 px-2 hover:bg-gray-100 dark:hover:bg-[#282828] cursor-pointer"
      >
        {/* Unread indicator */}
        <div className="w-4 h-full flex items-center justify-center shrink-0 mt-3">
          {!notification.read && <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />}
        </div>

        {/* Avatar */}
        <div className="shrink-0 mr-3 mt-1">
          <AvatarImg
            className="w-10 h-10 rounded-full object-cover"
            avatar={notification.creator.avatar}
            fullname={notification.creator.fullname}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2 pt-1">
          <div className="text-[15px] leading-snug line-clamp-3">
            <span className="font-bold">{notification.creator.fullname}</span>
            <span className="text-foreground/90 whitespace-pre-wrap ml-1">{message}</span>
          </div>
          <div className="text-[13px] text-muted-foreground mt-1">
            {timeAgo}
          </div>
        </div>

        {/* Thumbnail */}
        {(notification.video?.thumbnail || notification.short?.thumbnail || notification.post?.image) && (
          <div className="shrink-0 ml-2 w-[110px] mt-1">
            <img
              src={notification.video?.thumbnail || notification.short?.thumbnail || notification.post?.image}
              alt="thumbnail"
              className="w-full aspect-video object-cover rounded-md"
            />
          </div>
        )}

        {/* More Options */}
        <div className="shrink-0 ml-1">
          <DropdownMenu
            open={openDropdowns[index]}
            onOpenChange={(open) => setOpenDropdowns((prev) => ({ ...prev, [index]: open }))}
          >
            <DropdownMenuTrigger className="p-2 focus:outline-none rounded-full hover:bg-muted" onClick={(e) => e.stopPropagation()}>
              <EllipsisVertical size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="dark:bg-[#282828] p-0 rounded-lg shadow-lg" align="end">
              <button
                className="flex items-center space-x-3 hover:bg-muted-foreground/20 w-full p-3 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.createdAt);
                  setOpenDropdowns((prev) => ({ ...prev, [index]: false }));
                }}
              >
                <EyeOff size={18} />
                <span>Hide this notification</span>
              </button>
              {!notification.read && (
                <button
                  className="flex items-center space-x-3 hover:bg-muted-foreground/20 w-full p-3 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.createdAt);
                    setOpenDropdowns((prev) => ({ ...prev, [index]: false }));
                  }}
                >
                  <CheckCheck size={18} />
                  <span>Mark as read</span>
                </button>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-[100dvh] bg-white dark:bg-[#0F0F0F] flex flex-col pb-16">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-[#0F0F0F] flex items-center justify-between px-2 h-14">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold ml-2">Notifications</h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-muted" onClick={() => navigate('/search')}>
            <Search size={22} />
          </button>
          <button className="p-2 rounded-full hover:bg-muted">
            <EllipsisVertical size={22} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {/* <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-lg text-sm font-medium whitespace-nowrap">
          All
        </button>
        <button className="px-4 py-1.5 bg-[#F0F0F0] dark:bg-[#272727] text-foreground rounded-lg text-sm font-medium whitespace-nowrap">
          Comments
        </button>
        <button className="px-4 py-1.5 bg-[#F0F0F0] dark:bg-[#272727] text-foreground rounded-lg text-sm font-medium whitespace-nowrap">
          Mentions
        </button>
      </div> */}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {todayNotifications.length > 0 && (
            <div className="mb-4">
              <h2 className="px-4 py-3 text-sm font-bold text-muted-foreground">Today</h2>
              {todayNotifications.map((n, i) => renderNotificationItem(n, i, false))}
            </div>
          )}

          {olderNotifications.length > 0 && (
            <div>
              <h2 className="px-4 py-3 text-sm font-bold text-muted-foreground">Older</h2>
              {olderNotifications.map((n, i) =>
                renderNotificationItem(n, todayNotifications.length + i, i === olderNotifications.length - 1)
              )}
            </div>
          )}

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
