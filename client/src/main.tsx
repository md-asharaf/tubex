import "./index.css";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store/store.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  },
});
const rootElement = document.getElementById("root");
const root = createRoot(rootElement);
root.render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors expand />
      <App />
    </QueryClientProvider>
  </Provider>
);
