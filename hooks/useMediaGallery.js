import { useState, useEffect } from 'react';
import { setMediaFromS3 } from '../cognito/config';

const useMediaGallery = (cameraNumber) => {
  const [images, setImages] = useState([]);
  const pollInterval = 10000; // Polling interval in milliseconds (e.g., 3000 for 3 seconds)
  //const pollInterval = 60000; // Polling interval in milliseconds (e.g., 3000 for 3 seconds)

  useEffect(() => {
    let intervalId;

    const fetchImages = () => {
      if (cameraNumber) {
        setMediaFromS3(setImages, cameraNumber);
      }
    };

    if (cameraNumber) {
      fetchImages(); // Initial fetch
      intervalId = setInterval(fetchImages, pollInterval); // Start polling
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId); // Clear interval on unmount
      }
    };
  }, [cameraNumber, pollInterval]);

  return images;
};

export default useMediaGallery;