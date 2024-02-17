import React from 'react';
import imageStyles from '../styles/images.module.css';

const MediaGallery = ({ media, onMediaSelect, numColumns = 3 }) => {
  return (
    <div className={imageStyles.imgGallery} style={{ '--num-columns': numColumns }}>
      {media.map((file, index) => {
        return file.isVideo ? (
          <video
            key={index}
            src={file.mediaUrl}
            alt={`Media ${index}`}
            className={imageStyles.mediaItem}
            onClick={() => onMediaSelect(file)}
          />
        ) : (
          <img
            key={index}
            src={file.mediaUrl}
            alt={`Media ${index}`}
            onClick={() => onMediaSelect(file)}
          />
        );
      })}
    </div>
  );
};

export default MediaGallery;
