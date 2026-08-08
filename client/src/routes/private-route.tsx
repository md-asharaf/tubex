import { Account } from "@/components/root/account";
import { MyVideos } from "@/components/root/my-videos";
import { PlaylistNhistory } from "@/components/root/playlist-and-history";
import { Playlist } from "@/components/root/playlist/playlist";
import PlayLists from "@/components/root/playlist/playlists";
import { PrivateLayout } from "@/components/root/private-layout";
import { Subscriptions } from "@/components/root/subscriptions";
import { LikedVideos } from "@/components/root/video/liked-videos";
import { WatchHistory } from "@/components/root/watch-history";
import { WatchLater } from "@/components/root/watch-later";
import { YourVideos } from "@/components/root/your-videos";
import { Route } from "react-router-dom";

export function ChannelRoute() {
  return (
    <Route element={<PrivateLayout />}>
      <Route path="/watch-history" element={<WatchHistory />} />
      <Route path="/liked-videos" element={<LikedVideos />} />
      <Route path="/my-videos" element={<MyVideos />} />
      <Route path="/watch-later" element={<WatchLater />} />
      <Route path="/playlists" element={<PlayLists />} />
      <Route path="/playlist/:id" element={<Playlist />} />
      <Route path="/library" element={<PlaylistNhistory />} />
      <Route path="/subscriptions" element={<Subscriptions />} />
      <Route path="/your-videos" element={<YourVideos />} />
      <Route path="/account/:username" element={<Account />} />
    </Route>
  )
}