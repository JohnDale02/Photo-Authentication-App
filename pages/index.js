import React, { useState } from 'react';
import Head from 'next/head';

import LoginForm from '../components/LoginForm';
import ImageGallery from '../components/MediaGallery';
import MediaModal from '../components/MediaModal';
import Slider from '../components/Slider'; // Import the new component
import SignatureModal from '../components/SignatureModal';
import { downloadMedia, deleteMedia } from '../cognito/config'; // Adjust the path as needed

import useAuthentication from '../hooks/useAuthentication';
import useMediaGallery from '../hooks/useMediaGallery';

import styles from '../styles/login.module.css'; // Import as a module


export default function Login() {
  
  const {
    isLoggedIn,
    userDetails,
    login,
    logout,
    errorMessage
  } = useAuthentication();

  const [fullMedia, setFullMedia] = useState(null);
  const [isVideo, setIsVideo] = useState(null);
  const [fullMediaJson, setFullMediaJson] = useState(null);
  const [mediaFilename, setMediaFilename] = useState('');
  const [isSignatureModalVisible, setIsSignatureModalVisible] = useState(false);
  const [isFullMediaVisible, setIsFullMediaVisible] = useState(false);
  const [loginError, setLoginError] = useState(""); // State to hold login error message
  const [numColumns, setNumColumns] = useState(3); // State for dynamic number of columns

  const [media, fetchImages] = useMediaGallery(userDetails?.cameraNumber);

  const openFullMedia = async (mediaData) => {
    setFullMedia(mediaData.mediaUrl);
    setMediaFilename(mediaData.mediaFilename);
    setIsVideo(mediaData.isVideo);
    setIsFullMediaVisible(true);


    try {
      const response = await fetch(mediaData.jsonUrl);
      const jsonData = await response.json();
      setFullMediaJson(jsonData);
    } catch (error) {
      console.error("Error fetching JSON data:", error);
      setFullMediaJson(null);
    }
  };

  const closeFullMedia = () => {
    setFullMedia(null);
    setIsFullMediaVisible(false);
  };

  const openSignatureModal = () => {
    setIsSignatureModalVisible(true);
  };
  
  const closeSignatureModal = () => {
    setIsSignatureModalVisible(false);
  };

  const handleDownloadClick = () => {
    const mediaKey = mediaFilename; 

    if (userDetails) {
      downloadMedia(mediaKey, isVideo, userDetails.idToken, userDetails.cameraNumber);
    }
  };

  const handleDeleteClick = async () => {
    const mediaKey = mediaFilename; 

    if (userDetails) {
      await deleteMedia(mediaKey, isVideo, userDetails.idToken, userDetails.cameraNumber);
      closeFullMedia();
      fetchImages(); // Force re-fetch of the images
    }
    
  };


  const onLoginSuccess = ({ email, password, idToken, cameraNumber  }) => {
    login({ email, password, idToken, cameraNumber  });
    console.log("Login Success I think");
    setLoginError(''); // Clear any existing errors

  };

  const onLoginFailure = (errorMessage) => {
    setLoginError(errorMessage); // Set login error message
  };

  return (
    <>
      <Head>
        <title>Photo App</title>
      </Head>
      <div className={styles.titleContainer}>
        <h1 className={styles.pageTitle}>PhotoLock</h1>
        <h2 className={styles.pageSubtitle}>Secure Photo Storage</h2>
      </div>
  
      {!isLoggedIn ? (
        <>
          {loginError && <div className={styles.errorMessage}>{loginError}</div>}
          <LoginForm 
            onLoginSuccess={onLoginSuccess}
            onLoginFailure={onLoginFailure} 
          />
        </>
      ) : (
        <>
          <Slider numColumns={numColumns} setNumColumns={setNumColumns} /> 
          <ImageGallery media={media} onMediaSelect={openFullMedia} numColumns={numColumns}/>
          <MediaModal 
            isVisible={isFullMediaVisible} 
            media={fullMedia} 
            mediaJson={fullMediaJson} 
            mediaFilename={mediaFilename}
            isVideo={isVideo}
            onClose={closeFullMedia}
            onDownloadClick={handleDownloadClick}
            onDeleteClick={handleDeleteClick}
            openSignatureModal={openSignatureModal}
          />
          {fullMediaJson?.['Signature_Base64'] && (
            <SignatureModal 
              isVisible={isSignatureModalVisible} 
              signature={fullMediaJson['Signature_Base64']} 
              onClose={closeSignatureModal} 
            />
          )}
          {/* Add any additional UI elements or logic here */}
        </>
      )}
    </>
  );
}
