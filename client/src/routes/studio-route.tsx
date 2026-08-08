import { StudioLayout } from "@/components/root/studio/studio-layout";
import { ContentVideos } from "@/components/root/studio/channel/content/content-videos";
import { ContentPlaylists } from "@/components/root/studio/channel/content/content-playlists";
import { ContentPosts } from "@/components/root/studio/channel/content/content-posts";
import { ContentShorts } from "@/components/root/studio/channel/content/content-shorts";
import { AnalyticsLayout } from "@/components/root/studio/channel/analytics/analytics-layout";
import { CommunityLayout } from "@/components/root/studio/channel/community/community-layout";
import { SubtitlesLayout } from "@/components/root/studio/channel/subtitles/subtitles-layout";
import { ContentLayout } from "@/components/root/studio/channel/content/content-layout";
import { StudioVideo } from "@/components/root/studio/video";
import { StudioShort } from "@/components/root/studio/short";
import { StudioPost } from "@/components/root/studio/post";
import { StudioPlaylist } from "@/components/root/studio/playlist";
import { VideoAnalytics } from "@/components/root/studio/video/video-analytics";
import { VideoComments } from "@/components/root/studio/video/video-comments";
import { VideoDetails } from "@/components/root/studio/video/video-details";
import { ShortComments } from "@/components/root/studio/short/short-comments";
import { ShortAnalytics } from "@/components/root/studio/short/short-analytics";
import { ShortDetails } from "@/components/root/studio/short/short-details";
import { VideoSubtitles } from "@/components/root/studio/video/video-subtitles";
import { ShortSubtitles } from "@/components/root/studio/short/short-subtitles";
import { PlaylistVideos } from "@/components/root/studio/playlist/playlist-videos";
import { PlaylistAnalytics } from "@/components/root/studio/playlist/playlist-analytics";
import { PlaylistDetails } from "@/components/root/studio/playlist/playlist-details";
import { PostComments } from "@/components/root/studio/post/post-comments";
import { PostDetails } from "@/components/root/studio/post/post-details";
import { ChannelLayout } from "@/components/root/studio/channel/channel-layout";
import { Route, Navigate } from "react-router-dom";

export function StudioRoute() {
  return (
    <Route path="/studio" element={<StudioLayout />}>
      <Route path=":username" element={<ChannelLayout />}>
        <Route path="content" element={<ContentLayout />}>
          <Route index element={<Navigate to="videos" replace />} />
          <Route path="videos" element={<ContentVideos />} />
          <Route path="playlists" element={<ContentPlaylists />} />
          <Route path="posts" element={<ContentPosts />} />
          <Route path="shorts" element={<ContentShorts />} />
        </Route>
        <Route path="analytics" element={<AnalyticsLayout />} />
        <Route path="community" element={<CommunityLayout />} />
        <Route path="subtitles" element={<SubtitlesLayout />} />
      </Route>
      <Route path="video/:id" element={<StudioVideo />}>
        <Route index element={<Navigate to="edit" replace />} />
        <Route path="comments" element={<VideoComments />} />
        <Route path="analytics" element={<VideoAnalytics />} />
        <Route path="edit" element={<VideoDetails />} />
        <Route path="subtitles" element={<VideoSubtitles />} />
      </Route>
      <Route path="post/:id" element={<StudioPost />}>
        <Route path="comments" element={<PostComments />} />
        <Route path="edit" element={<PostDetails />} />
      </Route>
      <Route path="short/:id" element={<StudioShort />}>
        <Route index element={<Navigate to="edit" replace />} />
        <Route path="comments" element={<ShortComments />} />
        <Route path="edit" element={<ShortDetails />} />
        <Route path="analytics" element={<ShortAnalytics />} />
        <Route path="subtitles" element={<ShortSubtitles />} />
      </Route>
      <Route path="playlist/:id" element={<StudioPlaylist />}>
        <Route path="videos" element={<PlaylistVideos />} />
        <Route path="analytics" element={<PlaylistAnalytics />} />
        <Route path="edit" element={<PlaylistDetails />} />
      </Route>
    </Route>
  )
}