import api from '../services/api';

export const getCategoriesHierarchy = async () => {
  try {
    const response = await api.get('/categories/hierarchy');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories hierarchy:', error);
    throw error;
  }
};