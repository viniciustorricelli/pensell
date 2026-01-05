import Home from './pages/Home';
import Search from './pages/Search';
import AdDetails from './pages/AdDetails';
import CreateAd from './pages/CreateAd';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import MyAds from './pages/MyAds';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Search": Search,
    "AdDetails": AdDetails,
    "CreateAd": CreateAd,
    "Messages": Messages,
    "Chat": Chat,
    "Favorites": Favorites,
    "Profile": Profile,
    "MyAds": MyAds,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};