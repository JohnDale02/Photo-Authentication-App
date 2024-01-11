import { useState, useEffect } from 'react';
import { viewAlbum } from '../cognito/config';

const useImageGallery = (globalCameraNumber) => {
  const [images, setImages] = useState([]);

  useEffect(() => {
    console.log("Fetching images for camera number:", globalCameraNumber); // Debugging

    if (globalCameraNumber) {
      viewAlbum(setImages, globalCameraNumber);
    }
  }, [globalCameraNumber]);

  return images;
};

export default useImageGallery;
