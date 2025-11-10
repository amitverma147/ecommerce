'use client';
import { useState } from 'react';

export const useBulkModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const openBulkModal = (product) => {
    setSelectedProduct(product);
    setIsOpen(true);
  };

  const closeBulkModal = () => {
    setIsOpen(false);
    setSelectedProduct(null);
  };

  return {
    isOpen,
    selectedProduct,
    openBulkModal,
    closeBulkModal
  };
};