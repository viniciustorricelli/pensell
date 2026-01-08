import AdDetails from './pages/AdDetails';
import Chat from './pages/Chat';
import CreateAd from './pages/CreateAd';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Messages from './pages/Messages';
import MyAds from './pages/MyAds';
import Profile from './pages/Profile';
import Search from './pages/Search';
import TopUp from './pages/TopUp';
import EditAd from './pages/EditAd';
import Register from './pages/Register';
import SelectCommunity from './pages/SelectCommunity';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdDetails": AdDetails,
    "Chat": Chat,
    "CreateAd": CreateAd,
    "Favorites": Favorites,
    "Home": Home,
    "Messages": Messages,
    "MyAds": MyAds,
    "Profile": Profile,
    "Search": Search,
    "TopUp": TopUp,
    "EditAd": EditAd,
    "Register": Register,
    "SelectCommunity": SelectCommunity,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};