import { ChannelHome } from "@/components/root/channel/channel-home";
import { Channel } from "@/components/root/channel/channel-layout";
import { ChannelPlaylists } from "@/components/root/channel/channel-playlists";
import { ChannelPosts } from "@/components/root/channel/channel-posts";
import { ChannelShorts } from "@/components/root/channel/channel-shorts";
import { ChannelVideos } from "@/components/root/channel/channel-videos";
import { Route } from "react-router-dom";

export function ChannelRoute() {
  return (
    <Route path="channel/:username" element={<Channel />}>
      <Route path="" element={<ChannelHome />} />
      <Route path="videos" element={<ChannelVideos />} />
      <Route path="playlists" element={<ChannelPlaylists />} />
      <Route path="shorts" element={<ChannelShorts />} />
      <Route path="posts" element={<ChannelPosts />} />
    </Route>
  )
}