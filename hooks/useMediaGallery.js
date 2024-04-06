import { useState, useEffect, useCallback } from 'react';
import { setMediaFromS3 } from '../cognito/config';

const useMediaGallery = (bucketName_fingerprint) => {
  const [images, setImages] = useState([]);
  const pollInterval = 20000; // Polling interval in milliseconds (e.g., 3000 for 3 seconds)
  //const pollInterval = 60000; // Polling interval in milliseconds (e.g., 3000 for 3 seconds)

  const fetchImages = useCallback(() => {
    if (bucketName_fingerprint) {
      setMediaFromS3(setImages, bucketName_fingerprint);
    }
  }, [bucketName_fingerprint]);

  useEffect(() => {
    fetchImages(); // Initial fetch
    const intervalId = setInterval(fetchImages, pollInterval); // Start polling

    return () => clearInterval(intervalId); // Clear interval on unmount
  }, [fetchImages, pollInterval]);

  return [images, fetchImages]; // Return the fetch function so it can be called externally
};

export default useMediaGallery;
