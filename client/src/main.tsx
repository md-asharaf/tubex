import "./index.css";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store/store.ts";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { Toaster } from "sonner";
import App from "./App";
const rootElement = document.getElementById("root");
const root = createRoot(rootElement);
root.render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <Toaster position="bottom-right" richColors expand />
      <App />
    </QueryClientProvider>
  </Provider>
);
