import AdDetails from './pages/AdDetails';
import Chat from './pages/Chat';
import CreateAd from './pages/CreateAd';
import EditAd from './pages/EditAd';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Messages from './pages/Messages';
import MyAds from './pages/MyAds';
import Profile from './pages/Profile';
import Search from './pages/Search';
import SelectCommunity from './pages/SelectCommunity';
import TopUp from './pages/TopUp';
import SellerProfile from './pages/SellerProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdDetails": AdDetails,
    "Chat": Chat,
    "CreateAd": CreateAd,
    "EditAd": EditAd,
    "Favorites": Favorites,
    "Home": Home,
    "Messages": Messages,
    "MyAds": MyAds,
    "Profile": Profile,
    "Search": Search,
    "SelectCommunity": SelectCommunity,
    "TopUp": TopUp,
    "SellerProfile": SellerProfile,
}

export const pagesConfig = {
    mainPage: "SelectCommunity",
    Pages: PAGES,
    Layout: __Layout,
};