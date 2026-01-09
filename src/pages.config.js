import AdDetails from './pages/AdDetails';
import Chat from './pages/Chat';
import CreateAd from './pages/CreateAd';
import EditAd from './pages/EditAd';
import Favorites from './pages/Favorites';
import Messages from './pages/Messages';
import MyAds from './pages/MyAds';
import Profile from './pages/Profile';
import Search from './pages/Search';
import SellerProfile from './pages/SellerProfile';
import TopUp from './pages/TopUp';
import Home from './pages/Home';
import SelectCommunity from './pages/SelectCommunity';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdDetails": AdDetails,
    "Chat": Chat,
    "CreateAd": CreateAd,
    "EditAd": EditAd,
    "Favorites": Favorites,
    "Messages": Messages,
    "MyAds": MyAds,
    "Profile": Profile,
    "Search": Search,
    "SellerProfile": SellerProfile,
    "TopUp": TopUp,
    "Home": Home,
    "SelectCommunity": SelectCommunity,
}

export const pagesConfig = {
    mainPage: "SelectCommunity",
    Pages: PAGES,
    Layout: __Layout,
};