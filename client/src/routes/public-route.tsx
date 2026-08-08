import { Home } from "@/components/root/home/home";
import { Video } from "@/components/root/video/video";
import { Route } from "react-router-dom";
import { Short } from "@/components/root/short/short";
import { Post } from "@/components/root/post/post";
import { SearchedVideos } from "@/components/root/video/searched-videos";
import { MobileSearch } from "@/components/root/mobile-search";
import { MobileNotifications } from "@/components/root/mobile-notifications";
import { MobileSettings } from "@/components/root/mobile-settings";

export function PublicRoute() {
  return (<>
    <Route path="" element={<Home />} />
    <Route path="video/:id" element={<Video />} />
    <Route path="short/:id" element={<Short />} />
    <Route path="post/:id" element={<Post />} />
    <Route path="results" element={<SearchedVideos />} />
    <Route path="search" element={<MobileSearch />} />
    <Route path="notifications" element={<MobileNotifications />} />
    <Route path="settings" element={<MobileSettings />} />
  </>
  )
}