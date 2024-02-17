import React from 'react';
import imageStyles from '../styles/images.module.css';

const MediaModal = ({ isVisible, media, mediaJson, mediaFilename, isVideo, onClose, onDownloadClick, onDeleteClick, openSignatureModal }) => {
  if (!isVisible) return null;

  // Determine if the media is a video based on its file extension
  console.log("Is this a video?:", isVideo); 

  return (
    <div className={`${imageStyles.fullImg} ${isVisible ? imageStyles.show : ''}`} id="fullImgBox">
      <div className={imageStyles.imageDetails}>
        <h3>{mediaFilename || 'Filename Unknown'}</h3>

        {isVideo ? (
          <div className={imageStyles.videoWrapper}>
            <video controls>
              <source src={media} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <img src={media} alt="Full Size"/>
        )}

        {mediaJson && (
          <div className={imageStyles.jsonContainer}>
            {Object.keys(mediaJson).map((key) => {
              if (key !== 'Signature_Base64' && key !== 'Camera Number') {
                return (
                  <li key={key}>
                    <strong>{key}:</strong> {mediaJson[key]}
                  </li>
                );
              } if (key === 'Signature_Base64') {
                return (
                  <button onClick={openSignatureModal} key={key}>View Signature</button>
                );
              }
            })}
          </div>
        )}

        <div className={imageStyles.buttonContainer}>
        <button onClick={onDownloadClick}>
          Download
        </button>
        <button className={imageStyles.deleteButton} onClick={onDeleteClick}> {/* Change the onClick event to the delete function */}
          Delete
        </button>
        </div>

        <div>
          <span onClick={onClose}>X</span>
        </div>
      </div>
    </div>
  );
};

export default MediaModal;
