import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useState, useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import Home from "./Pages/Home";
import ProductListing from "./Pages/ProductListing";
import Footer from "./components/Footer";
import ProductDetails from "./Pages/ProductDetails";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import AboutUs from "./Pages/AboutUs";
import BusinessPartnerLogin from "./Pages/BusinessPartner/BusinessPartner.jsx";
import ContactUs from "./Pages/ContactUs";
import Cart from "./Pages/Cart";
import WhatsAppWidget from "./components/WhatsAppWidget/WhatsAppWidget.jsx"; // Import WhatsAppWidget
import MobileAccountPage from "./Pages/MobileAccountPage/MobileAccountPage.jsx";
import BusinessPartnerSignup from "./Pages/BusinessPartner/BusinessPartnerSignup.jsx"; // Import MobileAccountPage
import SubCategoryPage from "./Pages/SubCategoryPage/SubCategoryPage.jsx";
import Search from "./components/Search/index.jsx";
import MobileBannerCarousel from './components/MobileBannerCarousel/MobileBannerCarousel.jsx';
import MobileCategoriesBar from "./components/CategoriesBar/MobileCategoriesBar.jsx";
import { NotificationProvider } from "./contexts/NotificationContext.jsx";
import PaymentPage from "./Pages/Payment/PaymentPage.jsx";

import CustomPrinting from "./Pages/CustomPrinting/index.jsx";
import MyOrders from "./Pages/MyOrders/MyOrders.jsx";

import Account from "./Pages/Account";
import Wishlist from "./Pages/Wishlist";
import ResetPassword from "./Pages/ResetPassword";
import EnquiryHistory from "./Pages/EnquiryHistory"; // Add EnquiryHistory import
import ComingSoon from "./Pages/ComingSoon"; // Add ComingSoon import
// import PrivacyPolicy from './Pages/PrivacyPolicy';
import TermsOfService from "./Pages/TermsOfService";
import FAQ from "./Pages/FAQ";
import ShippingReturns from "./Pages/ShippingReturns";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext.jsx";
import { PromotionalProvider } from "./contexts/PromotionalContext.jsx";
import DynamicHead from "./components/DynamicHead";
import AnnouncementBar from "./components/AnnouncementBar";
import CategoriesBar from "./components/CategoriesBar";
import { LocationProvider } from "./contexts/LocationContext.jsx";
import LocationModal from "./components/LocationModal/LocationModal.jsx";
import MainSearchBar from "./components/MainSearchBar/MainSearchBar.jsx";
import ConditionalMobileCategoriesBar from "./components/CategoriesBar/ConditionalMobileCategoriesBar.jsx";
import MobileHeader from "./components/Header/MobileHeader.jsx";
import StoreNav from "./components/StoreNav/StoreNav.jsx";
import SubStoreNav from "./components/SubStoreNav/SubStoreNav.jsx";
import BbmPicks from "./components/BBM Picks/ShopByStore.jsx";
import Stores from "./components/BBM Picks/QuickPicks.jsx";
import Quickyfy from "./components/BBM Picks/BnB Expertise.jsx";
/* import OfferBannerSlider from "./components/NewSection/OfferBannerSlider.jsx";
import CategoryOfferBanner from "./components/NewSection/CategoryOfferBanner.jsx";
import GroupBannerSlider from "./components/NewSection/GroupBannerSlider.jsx"; */
import AllCategoriesPage from "./Pages/AllCategories/AllCategoriesPage.jsx";
import NewCategoryDivisionPage from "./Pages/New/NewCategoryDivisionPage.jsx";
import Notifications from "./Pages/Notifications/Notifications.jsx";
import MapLocationPage from "./components/MapLocationPage/MapLocationPage .jsx";
import AddressSelectionPage from "./components/AddressSelectionPage/AddressSelectionPage.jsx";
import DetailPage from "./Pages/NewSectionGroupDetailPage/DetailPage.jsx";
import ProductListingPage from "./Pages/NewProductListingPage/ProductListingPage.jsx";


// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Component to conditionally render header and other components
const ConditionalLayout = ({ children }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toggle function to open/close mobile sidebar menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if current route is any account/dashboard page
  const isDashboardPage = location.pathname === '/MyOrders' || 
                         location.pathname === '/account' || 
                         location.pathname === '/MobileAccount' || 
                         location.pathname === '/wishlist' || 
                         location.pathname === '/enquiry-history' || 
                         location.pathname === '/custom-printing' || 
                         location.pathname === '/Notifications' || 
                         location.pathname === '/contact-us' || 
                         location.pathname === '/about-us' || 
                         location.pathname === '/faq' || 
                         location.pathname === '/shipping-returns' || 
                         location.pathname === '/terms-of-service' || 
                         location.pathname === '/privacy-policy' ||
                         location.pathname === '/coming-soon' ||
                         location.pathname.includes('/wallet') ||
                         location.pathname.includes('/refund');

  const data = [
    { image: "https://i.postimg.cc/Tw85NQLJ/Candle2.jpg", label: "Office" },
    { image: "https://i.postimg.cc/Tw85NQLJ/Candle2.jpg", label: "Packaging" },
    { image: "https://i.postimg.cc/Tw85NQLJ/Candle2.jpg", label: "Essentia" },
    { image: "https://i.postimg.cc/Tw85NQLJ/Candle2.jpg", label: "Plus" },
    { image: "https://i.postimg.cc/Tw85NQLJ/Candle2.jpg", label: "More" },
  ];
  const Seconddata = [
    { image: "https://i.postimg.cc/zfvZpS8G/digital-digital-art-artwork-futuristic-futuristic-city-hd-wallpaper-preview.jpg", label: "Office" },
    { image: "https://i.postimg.cc/zfvZpS8G/digital-digital-art-artwork-futuristic-futuristic-city-hd-wallpaper-preview.jpg", label: "Packaging" },
    { image: "https://i.postimg.cc/zfvZpS8G/digital-digital-art-artwork-futuristic-futuristic-city-hd-wallpaper-preview.jpg", label: "Essentia" },
    { image: "https://i.postimg.cc/zfvZpS8G/digital-digital-art-artwork-futuristic-futuristic-city-hd-wallpaper-preview.jpg", label: "Plus" },
    { image: "https://i.postimg.cc/zfvZpS8G/digital-digital-art-artwork-futuristic-futuristic-city-hd-wallpager-preview.jpg", label: "More" },
  ];
  const Thirddata = [
    { image: "https://i.postimg.cc/zfFgL0VR/Whats-App-Image-2025-07-24-at-13-27-17.jpg", label: "Office" },
    { image: "https://i.postimg.cc/zfFgL0VR/Whats-App-Image-2025-07-24-at-13-27-17.jpg", label: "Packaging" },
    { image: "https://i.postimg.cc/zfFgL0VR/Whats-App-Image-2025-07-24-at-13-27-17.jpg", label: "Essentia" },
    { image: "https://i.postimg.cc/zfFgL0VR/Whats-App-Image-2025-07-24-at-13-27-17.jpg", label: "Plus" },
    { image: "https://i.postimg.cc/zfFgL0VR/Whats-App-Image-2025-07-24-at-13-27-17.jpg", label: "More" },
  ];

  return (
    <>
      {!isDashboardPage && <AnnouncementBar />}
      {!isDashboardPage && location.pathname !== '/' && (
        <>
          {isMobile ? <MobileHeader toggleMobileMenu={toggleMobileMenu} /> : <Header />}
          <div className="!sticky top-0">
            <MainSearchBar />
          </div>
          <StoreNav />
          <MobileBannerCarousel />
          <Stores title="BBM Picks" items={Seconddata} />
          <BbmPicks title="Recommended Store" items={data} />
          <Quickyfy title="Quickyfy" items={Thirddata} />
          <SubStoreNav />
          <MobileCategoriesBar />
          <CategoriesBar className="sm:hidden" mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen} />
        </>
      )}
      {!isDashboardPage && location.pathname === '/' && isMobile && (
        <MobileHeader toggleMobileMenu={toggleMobileMenu} />
      )}
      {!isDashboardPage && location.pathname === '/' && !isMobile && (
        <>
          <Header />
          <StoreNav />
          <Stores title="BBM Picks" items={Seconddata} />
          <BbmPicks title="Recommended Store" items={data} />
          <Quickyfy title="Quickyfy" items={Thirddata} />
        </>
      )}
      <LocationModal />
      {children}
    </>
  );
};

function App() {
  return (
    <>
      <AuthProvider>
        <LocationProvider>
          <SettingsProvider>
            <PromotionalProvider>
              <DynamicHead />
              <BrowserRouter>
                <AnnouncementBar />
                {isMobile ? <MobileHeader />: <Header/>}
                {/* <div className="mobile-search-bar-container w-full px-5 py-4 pt-5 z-999">
                  <Search />
                </div> */}
                <div className="!sticky top-0">
                  <MainSearchBar />
                </div>
                <LocationModal />
                <MobileBannerCarousel />
                <MobileCategoriesBar />
                <CategoriesBar className="sm:hidden" />
                <Routes>
                  <Route path={"/"} exact={true} element={<Home />} />
                  <Route
                    path={"/productListing"}
                    exact={true}
                    element={<ProductListing />}
                  />
                  <Route
                    path={"/product/:id"}
                    exact={true}
                    element={<ProductDetails />}
                  />
                  <Route path={"/login"} exact={true} element={<Login />} />
                  <Route path={"/signup"} exact={true} element={<Signup />} />
                  <Route
                    path={"/reset-password"}
                    exact={true}
                    element={<ResetPassword />}
                  />
                  <Route
                    path={"/about-us"}
                    exact={true}
                    element={<AboutUs />}
                  />
                  <Route
                    path={"/contact-us"}
                    exact={true}
                    element={<ContactUs />}
                  />
                  <Route path={"/cart"} exact={true} element={<Cart />} />
                  <Route
                    path={"/custom-printing"}
                    exact={true}
                    element={<CustomPrinting />}
                  />
                  {/* {<Route
                    path="/privacy-policy"
                    element={<PrivacyPolicy />}
                  /> } */}
                  <Route
                    path={"/terms-of-service"}
                    exact={true}
                    element={<TermsOfService />}
                  />
                  <Route path={"/faq"} exact={true} element={<FAQ />} />
                  <Route
                    path={"/MyOrders"}
                    exact={true}
                    element={<MyOrders />}
                  />
                  <Route
                    path={"/BusinessPartner"}
                    exact={true}
                    element={<BusinessPartnerLogin />}
                  />
                  <Route
                    path={"/BusinessPartnerSignup"}
                    exact={true}
                    element={<BusinessPartnerSignup />}
                  />
                  <Route
                    path="/subcategories/:categoryName"
                    element={<SubCategoryPage />}
                  />
                  <Route
                    path={"/shipping-returns"}
                    exact={true}
                    element={<ShippingReturns />}
                  />
                  <Route
                    path={"/account"}
                    exact={true}
                    element={
                      <ProtectedRoute>
                        <Account />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={"/MobileAccount"}
                    exact={true}
                    element={
                      <ProtectedRoute>
                        <MobileAccountPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={"/wishlist"}
                    exact={true}
                    element={
                      <ProtectedRoute>
                        <Wishlist />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={"/enquiry-history"}
                    exact={true}
                    element={
                      <ProtectedRoute>
                        <EnquiryHistory />
                      </ProtectedRoute>
                    }
                  />{" "}
                  {/* Add protected route for EnquiryHistory */}
                  <Route
                    path={"/coming-soon"}
                    exact={true}
                    element={<ComingSoon />}
                  />{" "}
                  {/* Add route for ComingSoon */}
                  {/* Fallback 404 route */}
                  <Route
                    path="*"
                    element={
                      <div style={{ padding: 40, textAlign: "center" }}>
                        <h2>404 - Page Not Found</h2>
                      </div>
                    }
                  />
                </Routes>
                <WhatsAppWidget />
                <Footer />
              </BrowserRouter>
              <NotificationProvider>
                <DynamicHead />
                <BrowserRouter>
                  <ConditionalLayout>
                  <Routes>
                    <Route path={"/"} exact={true} element={<Home />} />
                    <Route
                      path={"/productListing"}
                      exact={true}
                      element={<ProductListing />}
                    />
                    <Route
                      path={"/product/:id"}
                      exact={true}
                      element={<ProductDetails />}
                    />
                    <Route path={"/login"} exact={true} element={<Login />} />
                    <Route path={"/signup"} exact={true} element={<Signup />} />
                    <Route
                      path={"/reset-password"}
                      exact={true}
                      element={<ResetPassword />}
                    />
                    <Route
                      path={"checkout/select-location"}
                      exact={true}
                      element={<MapLocationPage />}
                    />
                    <Route
                      path={"/checkout/confirm-address"}
                      exact={true}
                      element={<AddressSelectionPage />}
                    />
                    <Route path="/checkout/payment" element={<PaymentPage />} />
                    <Route
                      path={"/about-us"}
                      exact={true}
                      element={<AboutUs />}
                    />
                    <Route
                      path={"/all"}
                      exact={true}
                      element={<AllCategoriesPage />}
                    />
                    <Route
                      path={"/contact-us"}
                      exact={true}
                      element={<ContactUs />}
                    />
                    <Route
                      path={"/Notifications"}
                      exact={true}
                      element={<Notifications />}
                    />
                    <Route path={"/cart"} exact={true} element={<Cart />} />
                    <Route
                      path={"/custom-printing"}
                      exact={true}
                      element={<CustomPrinting />}
                    />
                    {<Route
                      path="/privacy-policy"
                      element={<PrivacyPolicy />}
                    />}
                    <Route
                      path={"/terms-of-service"}
                      exact={true}
                      element={<TermsOfService />}
                    />
                    <Route path={"/faq"} exact={true} element={<FAQ />} />
                    <Route
                      path={"/MyOrders"}
                      exact={true}
                      element={<MyOrders />}
                    />
                    <Route path="/category/:id/:name" element={<NewCategoryDivisionPage />} />
                    {/* <Route path="/category/:id/:name" element={<NewCategoryDivisionPage />} /> */}
                    <Route path="/:section/:id" element={<DetailPage />} />
                    <Route
                      path={"/BusinessPartner"}
                      exact={true}
                      element={<BusinessPartnerLogin />}
                    />
                    <Route
                      path={"/BusinessPartnerSignup"}
                      exact={true}
                      element={<BusinessPartnerSignup />}
                    />
                    <Route
                      path="/subcategories/:categoryName"
                      element={<SubCategoryPage />}
                    />
                    <Route
                      path="/subcategories"
                      element={<SubCategoryPage />}
                    />
                    <Route
                      path={"/shipping-returns"}
                      exact={true}
                      element={<ShippingReturns />}
                    />
                    <Route
                      path={"/account"}
                      exact={true}
                      element={
                        <ProtectedRoute>
                          <Account />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={"/MobileAccount"}
                      exact={true}
                      element={
                        <ProtectedRoute>
                          <MobileAccountPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/ProductLisingPage/:Name/:id" element={<ProductListingPage />} />
                    <Route path="/ProductLisingPage/:Name" element={<ProductListingPage />} />
                    <Route
                      path={"/wishlist"}
                      exact={true}
                      element={
                        <ProtectedRoute>
                          <Wishlist />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={"/enquiry-history"}
                      exact={true}
                      element={
                        <ProtectedRoute>
                          <EnquiryHistory />
                        </ProtectedRoute>
                      }
                    />{" "}
                    {/* Add protected route for EnquiryHistory */}
                    <Route
                      path={"/coming-soon"}
                      exact={true}
                      element={<ComingSoon />}
                    />{" "}
                    {/* Add route for ComingSoon */}
                    {/* Fallback 404 route */}
                    <Route
                      path="*"
                      element={
                        <div style={{ padding: 40, textAlign: "center" }}>
                          <h2>404 - Page Not Found</h2>
                        </div>
                      }
                    />
                  </Routes>
                  </ConditionalLayout>
                  <WhatsAppWidget />
                  <Footer />
                </BrowserRouter>
              </NotificationProvider>
            </PromotionalProvider>
          </SettingsProvider>
        </LocationProvider>
      </AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
