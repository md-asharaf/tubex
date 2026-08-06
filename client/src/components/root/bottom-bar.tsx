import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { GoHome, GoHomeFill } from "react-icons/go";
import { SiYoutubeshorts } from "react-icons/si";
import {
  MdOutlineSubscriptions,
  MdSubscriptions,
} from "react-icons/md";
import { RootState } from "@/store/store";
import { AvatarImg } from "./avatar-image";
import { CreateDropdown } from "./modals/create-dropdown";

export const BottomBar = () => {
  const userData = useSelector((state: RootState) => state.auth.userData);
  const shortId = useSelector(
    (state: RootState) => state.short.randomShortId
  );
  return (
    <div className="flex items-center justify-around bg-white dark:bg-[#0F0F0F] dark:text-white py-1 px-1 border-t border-gray-200 dark:border-white/10 text-[10px]">
      <NavLink to={"/"} className="w-16">
        {({ isActive }) => (
          <div className="flex flex-col items-center gap-1">
            {isActive ? (
              <GoHomeFill className="text-2xl" />
            ) : (
              <GoHome className="text-2xl" />
            )}
            <span>Home</span>
          </div>
        )}
      </NavLink>
      <NavLink to={`/short/${shortId}`} className="w-16">
        <div className="flex flex-col items-center gap-1">
          <SiYoutubeshorts className="text-2xl" />
          <span>Shorts</span>
        </div>
      </NavLink>

      {/* Create Dropdown */}
      <div className="flex flex-col items-center justify-center -mt-2 border rounded-full">
        <CreateDropdown />
      </div>

      <NavLink to={"/subscriptions"} className="w-16">
        {({ isActive }) => (
          <div className="flex flex-col items-center gap-1">
            {isActive ? (
              <MdSubscriptions className="text-2xl" />
            ) : (
              <MdOutlineSubscriptions className="text-2xl" />
            )}
            <span>Subscriptions</span>
          </div>
        )}
      </NavLink>
      {userData?.username && (
        <NavLink to={`/library?u=${userData.username}`} className="w-16">
          {({ isActive }) => (
            <div className="flex flex-col items-center gap-1">
              <div className={`rounded-full p-[1px] ${isActive ? 'border-[1.5px] border-black dark:border-white' : 'border-[1.5px] border-transparent'}`}>
                <AvatarImg
                  fullname={userData.fullname}
                  avatar={userData.avatar}
                  className="h-[22px] w-[22px] rounded-full object-cover"
                />
              </div>
              <span>You</span>
            </div>
          )}
        </NavLink>
      )}
    </div>
  );
};
