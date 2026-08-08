import { Route } from "react-router-dom";
import { ChannelRoute } from "./channel-route";
import { PrivateRoute } from "./private-route";
import { RootLayout } from "@/components/root/root-layout";
import { PublicRoute } from "./public-route";

export function RootRoute() {
  return (
    <Route element={<RootLayout />}>
      {PublicRoute()}
      {ChannelRoute()}
      {PrivateRoute()}
    </Route>
  )
}