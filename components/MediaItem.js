

/////// CURRENTLY NOT IN USE ///////
/////// CURRENTLY NOT IN USE ///////
/////// CURRENTLY NOT IN USE ///////
/////// CURRENTLY NOT IN USE ///////
/////// CURRENTLY NOT IN USE ///////
/////// CURRENTLY NOT IN USE ///////
/////// CURRENTLY NOT IN USE ///////
/////// CURRENTLY NOT IN USE ///////
/////// CURRENTLY NOT IN USE ///////
/////// CURRENTLY NOT IN USE ///////

import React, { useState } from 'react';
import imageStyles from '../styles/images.module.css';

const MediaItem = ({ key, file, onMediaSelect }) => {
  const [isLoading, setLoading] = useState(true);

  const handleMediaLoad = () => {
    setLoading(false);
  };

  return (
    <div className={imageStyles.mediaItemWrapper}>
      {isLoading && (
        <div className={imageStyles.loader}></div> // Use the CSS loader
      )}
      {file.isVideo ? (
          <video
          key={key}
          src={file.mediaUrl}
          alt={`Media ${key}`}
          className={imageStyles.mediaItem}
          onLoadedData={handleMediaLoad}
          onClick={() => onMediaSelect(file)}
        />
      ) : (
        <img
          key={key}
          src={file.mediaUrl}
          alt={`Media ${key}`}
          
          onClick={() => onMediaSelect(file)}
        />
      )}
    </div>
  );
};

export default MediaItem;
