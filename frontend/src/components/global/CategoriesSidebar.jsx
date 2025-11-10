"use client";
import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { getCategoriesHierarchy } from '../../api/categories';

const CategoriesSidebar = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategoriesHierarchy();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 hidden lg:block">
      <div className="fixed inset-0 bg-black/30" onClick={onClose}></div>
      <div className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl transform translate-x-0 transition-transform duration-300 ease-in-out overflow-y-auto">
        <div className="px-6 py-4 flex justify-between items-center bg-[#FF6B00] text-white">
          <h2 className="text-xl font-bold">All Categories</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className="p-4 bg-gray-50">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading categories...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category.id} className="">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 px-2">
                    {category.name}
                  </h3>
                  
                  {category.subcategories && category.subcategories.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {category.subcategories.map((subcategory) => (
                        <Link
                          key={subcategory.id}
                          href={`/pages/categories/subcategory/${category.id}/${subcategory.id}?categoryName=${encodeURIComponent(category.name)}&subcategoryName=${encodeURIComponent(subcategory.name)}`}
                          className="bg-white p-3 rounded-lg hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-gray-200 text-center group"
                          onClick={onClose}
                        >
                          <div className="w-full h-16 mb-2 relative group-hover:scale-105 transition-transform">
                            {subcategory.image_url ? (
                              <Image
                                src={subcategory.image_url}
                                alt={subcategory.name}
                                fill
                                className="object-cover rounded-md"
                                sizes="(max-width: 768px) 33vw, 25vw"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center text-2xl">
                                {subcategory.icon || '📦'}
                              </div>
                            )}
                          </div>
                          <div className="text-xs font-medium text-gray-700 leading-tight">
                            {subcategory.name}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesSidebar;