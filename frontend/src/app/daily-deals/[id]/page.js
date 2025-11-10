"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { dailyDealsService } from "../../../services/dailyDealsService";

const DailyDealPage = () => {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id;

  const [deal, setDeal] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDealAndProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch deal details and products in parallel
        const [dealResponse, productsResponse] = await Promise.all([
          dailyDealsService.getDailyDealById(dealId),
          dailyDealsService.getProductsForDailyDeal(dealId),
        ]);

        if (dealResponse.success) {
          setDeal(dealResponse.deal);
        } else {
          setError("Failed to load deal details");
        }

        setProducts(productsResponse || []);
      } catch (err) {
        console.error("Error fetching deal:", err);
        setError("Failed to load deal information");
      } finally {
        setLoading(false);
      }
    };

    if (dealId) {
      fetchDealAndProducts();
    }
  }, [dealId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <div className="h-64 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="w-full md:w-2/3">
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md p-4">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "Deal Not Found"}
          </h1>
          <p className="text-gray-600 mb-6">
            The daily deal you're looking for doesn't exist or has expired.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-orange-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/" className="hover:text-orange-600 transition-colors">
            Daily Deals
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{deal.title}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Deal Header - Surprise Sale Layout */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center p-8">
            {/* Left Side - Product Image with Prime Badge */}
            <div className="relative w-1/3">
              <div className="relative bg-gradient-to-br from-orange-200 to-orange-300 rounded-2xl p-6 h-80">
              
                
                {/* Product Image */}
                <div className="flex items-center justify-center h-full">
                  <Image
                    src={
                      deal.image_url ||
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjE3NiIgdmlld0JveD0iMCAwIDI0MCAxNzYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNDAiIGhlaWdodD0iMTc2IiBmaWxsPSIjZjNlNGVkIi8+Cjx0ZXh0IHg9IjEyMCIgeT0iODgiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3OTdhNyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UHJvZHVjdCBJbWFnZTwvdGV4dD4KPC9zdmc+"
                    }
                    alt={deal.title}
                    width={200}
                    height={200}
                    className="object-contain max-h-48"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjE3NiIgdmlld0JveD0iMCAwIDI0MCAxNzYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNDAiIGhlaWdodD0iMTc2IiBmaWxsPSIjZjNlNGVkIi8+Cjx0ZXh0IHg9IjEyMCIgeT0iODgiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3OTdhNyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UHJvZHVjdCBJbWFnZTwvdGV4dD4KPC9zdmc+";
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Side - Deal Info */}
            <div className="w-2/3 pl-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Surprise Sale
              </h1>
              
              <div className="mb-6">
                <span className="inline-block bg-orange-500 text-white text-lg font-bold px-6 py-3 rounded-full">
                  Enjoy Discount Up to 50% Off
                </span>
              </div>

              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Discover amazing products at unbeatable prices! This exclusive deal features{" "}
                <span className="font-semibold text-orange-600">
                  {products.length} premium products
                </span>{" "}
                carefully selected just for you.
              </p>

              <div className="flex flex-wrap gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{products.length}</div>
                  <div className="text-sm text-gray-600">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">24</div>
                  <div className="text-sm text-gray-600">Hours Left</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl text-blue-600">★</div>
                  <div className="text-sm text-gray-600">Limited Time</div>
                </div>
              </div>

              <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Shop All Products
              </button>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden p-6">
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center">
              Surprise Sale
            </h1>
            
            {/* Discount Badge */}
            <div className="mb-6 text-center">
              <span className="inline-block bg-orange-500 text-white text-base font-bold px-2 py-1 rounded-full">
                Enjoy Discount Up to 50% Off
              </span>
            </div>

            {/* Image and Description Row */}
            <div className="flex gap-4 mb-6">
              {/* Left - Product Image */}
              <div className="w-1/2">
                <div className="relative bg-gradient-to-br from-orange-200 to-orange-300 rounded-xl p-4 h-40">

                  <div className="flex items-center justify-center h-full">
                    <Image
                      src={
                        deal.image_url ||
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjE3NiIgdmlld0JveD0iMCAwIDI0MCAxNzYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNDAiIGhlaWdodD0iMTc2IiBmaWxsPSIjZjNlNGVkIi8+Cjx0ZXh0IHg9IjEyMCIgeT0iODgiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3OTdhNyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UHJvZHVjdCBJbWFnZTwvdGV4dD4KPC9zdmc+"
                      }
                      alt={deal.title}
                      width={120}
                      height={120}
                      className="object-contain max-h-28"
                      onError={(e) => {
                        e.target.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjE3NiIgdmlld0JveD0iMCAwIDI0MCAxNzYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNDAiIGhlaWdodD0iMTc2IiBmaWxsPSIjZjNlNGVkIi8+Cjx0ZXh0IHg9IjEyMCIgeT0iODgiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3OTdhNyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UHJvZHVjdCBJbWFnZTwvdGV4dD4KPC9zdmc+";
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right - Description */}
              <div className="w-1/2 flex items-center">
                <p className="text-gray-600 text-sm leading-relaxed">
                  Discover amazing products at unbeatable prices! This exclusive deal features{" "}
                  <span className="font-semibold text-orange-600">
                    {products.length} premium products
                  </span>{" "}
                  carefully selected just for you.
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">{products.length}</div>
                <div className="text-xs text-gray-600">Products</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">24</div>
                <div className="text-xs text-gray-600">Hours Left</div>
              </div>
              <div className="text-center">
                <div className="text-xl text-blue-600">★</div>
                <div className="text-xs text-gray-600">Limited Time</div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-base transition-all duration-300 shadow-lg">
                Shop All Products
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Deal Products ({products.length})
          </h2>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Products Available
              </h3>
              <p className="text-gray-600">
                Products for this deal are being prepared. Check back soon!
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {products.map((item) => {
                const product = item.products;
                console.log('Product data:', product);
                if (!product) return null;

                return (
                  <div
                    key={item.product_id}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group sm:block flex relative"
                  >
                    {/* Mobile Wishlist Icon - Top Right of Card */}
                    <div className="absolute top-1 right-1 z-20 sm:hidden">
                      <button className="p-1 focus:outline-none active:outline-none focus:ring-0 focus:border-none" style={{outline: 'none', border: 'none', boxShadow: 'none'}}>
                        <svg className="w-4 h-4 text-gray-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Product Image */}
                    <div 
                      className="relative h-32 sm:h-48 w-1/3 sm:w-full bg-gray-100 overflow-hidden cursor-pointer"
                      onClick={() => router.push(`/singleproduct/${product.id}`)}
                    >
                     
                      
                      {/* Desktop Wishlist Icon */}
                      <div className="absolute top-2 right-2 z-10 hidden sm:block">
                        <button className="p-1.5 focus:outline-none active:outline-none focus:ring-0 focus:border-none" style={{outline: 'none', border: 'none', boxShadow: 'none'}}>
                          <svg className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>

                      <Image
                        src={product.image || ""}
                        alt={product.name}
                        width={300}
                        height={200}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNlNGVkIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5NzE3YTciIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=";
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="p-2 sm:p-4 flex-1 flex flex-col justify-between">
                       
                        {/* Brand Name */}
                        <div className="text-xs text-gray-600 mt-1 mb-1">
                           {product.brand || 'BigBestMart'}
                        </div>

                      
                      <h3 
                        className="font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors text-sm sm:text-base cursor-pointer"
                        onClick={() => router.push(`/singleproduct/${product.id}`)}
                      >
                        {product.name}
                      </h3>

                      {product.category && (
                        <div className="mb-1 sm:mb-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {product.category}
                          </span>
                        </div>
                      )}
                      
                   
                        {/* Unit Information */}
                        <div className="text-xs text-gray-600 mt-0.5">
                         {product.unit || product.weight || '1 Piece'}
                        </div>

                      {/* Price Section */}
                      <div className="mb-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-black">
                            ₹{product.price}
                          </span>
                          {product.discount && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{Math.round(Number(product.price) / (1 - Number(product.discount)/100))}
                            </span>
                          )}
                        </div>
                        
                        {/* Savings Amount */}
                        {product.discount && product.price ? (
                          <div className="flex flex-col mt-1">
                            <div className="text-xs text-green-600">
                              You Save:
                            </div>
                            <div className="text-sm font-semibold text-green-600">
                              ₹{Math.round(Number(product.price) * Number(product.discount) / (100 - Number(product.discount)))} ({product.discount}% Off)
                            </div>
                          </div>
                        ) : console.log('Debug - Price:', product.price, 'Discount:', product.discount)}

                        </div>

                      {/* Rating */}
                      <div className="flex items-center mb-3">
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400 text-sm">★★★★★</span>
                          <span className="text-sm text-gray-600">
                            {product.rating || 4.5}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({product.review_count || 352})
                          </span>
                        </div>
                      </div>

                      {/* Mobile Quantity and Add to Cart */}
                      <div className="flex items-center gap-2 sm:hidden">
                        
                        <button 
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-1.5 px-3 rounded font-medium text-xs transition-colors h-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add to cart logic here
                          }}
                        >
                          Add to Cart
                        </button>
                      </div>

                      {/* Desktop Add to Cart Button */}
                      <button 
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors border border-orange-500 hidden sm:block"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add to cart logic here
                        }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Back to Deals Button */}
        <div className="text-center">
          <button
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            ← Back to All Deals
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyDealPage;
