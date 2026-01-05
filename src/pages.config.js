import Home from './pages/Home';
import Search from './pages/Search';
import AdDetails from './pages/AdDetails';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Search": Search,
    "AdDetails": AdDetails,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};