import React, { useState } from 'react';
import Head from 'next/head';

import LoginForm from '../components/LoginForm';
import ImageGallery from '../components/ImageGallery';
import ImageModal from '../components/ImageModal';
import Slider from '../components/Slider'; // Import the new component
import SignatureModal from '../components/SignatureModal';
import { downloadImageAndJson } from '../cognito/config'; // Adjust the path as needed

import useAuthentication from '../hooks/useAuthentication';
import useImageGallery from '../hooks/useImageGallery';

import styles from '../styles/login.module.css'; // Import as a module


export default function Login() {
  
  const {
    isLoggedIn,
    userDetails,
    login,
    logout,
    errorMessage
  } = useAuthentication();

  const [fullImage, setFullImage] = useState(null);
  const [fullImageJson, setFullImageJson] = useState(null);
  const [imageFilename, setImageFilename] = useState('');
  const [isSignatureModalVisible, setIsSignatureModalVisible] = useState(false);
  const [isFullImageVisible, setIsFullImageVisible] = useState(false);
  const [loginError, setLoginError] = useState(""); // State to hold login error message
  const [numColumns, setNumColumns] = useState(3); // State for dynamic number of columns

  const images = useImageGallery(userDetails?.cameraNumber);

  const openFullImage = async (imageData) => {
    setFullImage(imageData.imageUrl);
    setImageFilename(imageData.imageFilename);
    setIsFullImageVisible(true);


    try {
      const response = await fetch(imageData.jsonUrl);
      const jsonData = await response.json();
      setFullImageJson(jsonData);
    } catch (error) {
      console.error("Error fetching JSON data:", error);
      setFullImageJson(null);
    }
  };

  const closeFullImage = () => {
    setFullImage(null);
    setIsFullImageVisible(false);
  };

  const openSignatureModal = () => {
    setIsSignatureModalVisible(true);
  };
  
  const closeSignatureModal = () => {
    setIsSignatureModalVisible(false);
  };

  const handleDownloadClick = () => {
    const imageKey = imageFilename; 
    if (userDetails) {
      downloadImageAndJson(imageKey, userDetails.idToken, userDetails.cameraNumber);
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
          <ImageGallery images={images} onImageSelect={openFullImage} numColumns={numColumns}/>
          <ImageModal 
            isVisible={isFullImageVisible} 
            image={fullImage} 
            imageJson={fullImageJson} 
            imageFilename={imageFilename}
            onClose={closeFullImage}
            onDownloadClick={handleDownloadClick}
            openSignatureModal={openSignatureModal}
          />
          {fullImageJson?.['Signature_Base64'] && (
            <SignatureModal 
              isVisible={isSignatureModalVisible} 
              signature={fullImageJson['Signature_Base64']} 
              onClose={closeSignatureModal} 
            />
          )}
          {/* Add any additional UI elements or logic here */}
        </>
      )}
    </>
  );
}
