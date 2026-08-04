import {IUser} from "@/interfaces";
import {createSlice} from "@reduxjs/toolkit";

interface IAuthData{
    userData: IUser | null;
}
const rawData = localStorage.getItem("auth_data");
let authData: Partial<IAuthData> | null = null;
try {
    authData = rawData ? JSON.parse(rawData) : null;
} catch {
    authData = null;
}

const initialState: IAuthData = {
    userData: authData?.userData ?? null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action) => {
            state.userData = action.payload;
        },
        logout: (state) => {
            state.userData = null;
        },
    },
});
export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
