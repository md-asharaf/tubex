import { Routes, BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import { RootState } from "./store/store";
import { useNotification } from "./hooks/use-notification";
import { useSelector } from "react-redux";
import { AuthRoute } from "./routes/auth-route";
import { StudioRoute } from "./routes/studio-route";
import { RootRoute } from "./routes/root-route";

function App() {
  const theme = useSelector((state: RootState) => state.theme.mode);

  useNotification();

  useEffect(() => {
    document.body.classList.remove("dark", "light");
    document.body.classList.add(theme);
  }, [theme]);
  return (
    <BrowserRouter>
      <Routes>
        {AuthRoute()}
        {RootRoute()}
        {StudioRoute()}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
