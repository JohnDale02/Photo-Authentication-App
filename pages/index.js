import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import styles from '../styles/login.module.css'; // Import as a module
import imageStyles from '../styles/images.module.css'

import AWS from 'aws-sdk';
import { CognitoUserPool, CognitoUserAttribute, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

import { useState } from 'react';
import { useRouter } from 'next/router';

//=============== AWS IDs ===============
var userPoolId = 'us-east-2_jgICLJECT';
var clientId = '4uda3lbttf8o7t7iu1jap3dr1h';
var region = 'us-east-2';
var identityPoolId = 'us-east-2:27d074d6-1504-4bbf-8394-45f8a4595b87';
//=============== AWS IDs ===============

var cognitoUser;
var idToken;
var userPool;
var globalCameraNumber = null;

var poolData = { 
  UserPoolId : userPoolId,
  ClientId : clientId,
};


function getCognitoIdentityCredentials(){
  AWS.config.region = region;

  var loginMap = {};
  loginMap['cognito-idp.' + region + '.amazonaws.com/' + userPoolId] = idToken;

  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
    Logins: loginMap
  });

  AWS.config.credentials.clearCachedId();

  AWS.config.credentials.get(function(err) {
      if (err){
        console.log("There was an error getting credentials")
        console.log(err.message);
      }
      else {
        console.log('AWS Access Key: '+ AWS.config.credentials.accessKeyId);
        console.log('AWS Secret Key: '+ AWS.config.credentials.secretAccessKey);
        console.log('AWS Session Token: '+ AWS.config.credentials.sessionToken);
      }
  });
}


function viewAlbum(setImages) {
  var bucketName = 'camera' + globalCameraNumber + 'verifiedimages';

  var s3 = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: bucketName }
  });

  s3.listObjects({ Bucket: bucketName }, function(err, data) {
    if (err) {
        console.log("There was an error viewing your album: " + err.message);
        return;
    }

    data.Contents.sort((a, b) => b.LastModified - a.LastModified);

    var files = data.Contents.reduce((acc, file) => {
      if (file.Key.endsWith('.png')) {
        const jsonKey = file.Key.replace('.png', '.json');
        acc.push({
          pngKey: file.Key,
          jsonKey: jsonKey
        });
      }
      return acc;
    }, []);

    var href = this.request.httpRequest.endpoint.href;
    var bucketUrl = href + bucketName + "/";

    var photos = files.map(({ pngKey, jsonKey }) => ({
      imageUrl: bucketUrl + encodeURIComponent(pngKey),
      jsonUrl: bucketUrl + encodeURIComponent(jsonKey),
    }));

    console.log("Photos:" + photos);

    setImages(photos);
  });
}

function extractImageNameFromUrl(url) {
  // Use a regular expression to extract the file name with extension
  const match = url.match(/([^\/]+\.png)$/); // This regex will match the filename ending with .png
  if (match) {
    return match[0];
  } else {
    return "No image name found in URL.";
  }
}

export default function Login() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [images, setImages] = useState([]);
  const [fullImage, setFullImage] = useState(null);
  const [fullImageJson, setFullImageJson] = useState(null);
  const [isSignatureModalVisible, setIsSignatureModalVisible] = useState(false);
  const [imageFilename, setImageFilename] = useState('');
  const [numColumns, setNumColumns] = useState(3); 


  const [errorMessage, setErrorMessage] = useState('');
  const [isFullImageVisible, setIsFullImageVisible] = useState(false);


  const openFullImage = async (imageData) => {
    setFullImage(imageData.imageUrl);
    setImageFilename(extractImageNameFromUrl(imageData.imageUrl));
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

const downloadImageAndJson = async (imageKey) => {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    region: region,
    credentials: new AWS.CognitoIdentityCredentials({
      IdentityPoolId: identityPoolId,
      Logins: {
        [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken,
      },
    }),
  });

  const bucketName = 'camera' + globalCameraNumber + "verifiedimages";

  // Helper function to create and trigger a download link
  const triggerDownload = (url, filename) => {
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Get signed URL and download the image
  const imageParams = {
    Bucket: bucketName,
    Key: imageKey,
  };

  s3.getSignedUrl('getObject', imageParams, (err, imageUrl) => {
    if (err) {
      console.error('Error getting signed URL for image:', err);
      return;
    }
    triggerDownload(imageUrl, imageKey);
  });

  // Get signed URL and download the JSON
  const jsonKey = imageKey.replace('.png', '.json');
  const jsonParams = {
    Bucket: bucketName,
    Key: jsonKey,
  };

  setTimeout(() => {
    s3.getSignedUrl('getObject', jsonParams, (err, jsonUrl) => {
      if (err) {
        console.error('Error getting signed URL for JSON:', err);
        return;
      }
      triggerDownload(jsonUrl, jsonKey);
    });

  }, 3000);
  
};

  const openSignatureModal = () => {
    setIsSignatureModalVisible(true);
  };
  
  const closeSignatureModal = () => {
    setIsSignatureModalVisible(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    userPool = new CognitoUserPool(poolData);
    var authenticationData = {
      Username : email,
      Password : password,
    };
    var authenticationDetails = new AuthenticationDetails(authenticationData);
    var userData = {
        Username : email,
        Pool : userPool
    };

    cognitoUser = new CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
          console.log('Logged in!');
          idToken = result.getIdToken().getJwtToken();
          getCognitoIdentityCredentials();
          cognitoUser.getUserAttributes(function(err, attributes){
            if (err) {
                console.log(err.message);
            } else{
              let cameraNumber = attributes.find(attr => attr.getName() === 'custom:camera_number');

              if (cameraNumber){
                  globalCameraNumber = cameraNumber.getValue(); // Store camera number globally
                  console.log('Camera Number: ' + cameraNumber.getValue());
                  setIsLoggedIn(true);
                  viewAlbum(setImages);
    
              } else {
                  console.log('Camera Number not set.');
              }
            }
          });
      },
      onFailure: function(err) {
          setErrorMessage("There was an failure authenticating the user:")
          return;
      },

    });

  };

  const handleDownloadClick = () => {
    const imageKey = extractImageNameFromUrl(fullImage); // Implement this function to extract the key from the URL
    downloadImageAndJson(imageKey);
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
        <div className={styles.wrapper}>
          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
          <form onSubmit={handleLogin}>
            <h1>Login</h1>
            <div className={styles.inputBox}>
              <input type="text" placeholder="Email" required 
                onChange={(e) => setEmail(e.target.value)}/>
              <i className="bx bxs-user"></i>
            </div>

            <div className={styles.inputBox}>
              <input type="password" placeholder="Password" required 
                onChange={(e) => setPassword(e.target.value)}/>
              <i className="bx bxs-lock-alt"></i>
            </div>

            <div className={styles.rememberForget}>
              <label><input type="checkbox" /> Remember me </label>
              <Link href="/resetPassword" passHref>
                Forgot password?
              </Link>
            </div>

            <button type="submit" className={styles.btn}>Log in</button>

            <div className={styles.registerLink}>
              <p>Don't have an account? <Link href="/register" passHref>
                Register
              </Link></p>
            </div>
          </form>
        </div>
      ) : (
        <>
          {isFullImageVisible && (
            <div className={`${imageStyles.fullImg} ${isFullImageVisible ? imageStyles.show : ''}`} id="fullImgBox">
              <div className={imageStyles.imageDetails}>
                <h3>Image Details: {imageFilename}</h3>
                <img src={fullImage} alt="Full Size" />

                {fullImageJson && (
                  <div className={imageStyles.jsonContainer}>
                      {Object.keys(fullImageJson).map((key) => {
                        if (key !== 'Signature_Base64') {
                          return (
                            <li key={key}>
                              <strong>{key}:</strong> {fullImageJson[key]}
                            </li>
                          );
                        } else {
                          return (
                              <button onClick={openSignatureModal}>View Signature</button>
                          );
                        }
                      })}
                  </div>
                )}
                <div className={imageStyles.buttonContainer}>
                  <button onClick={handleDownloadClick}>
                    Download Image and Metadata
                  </button>
                </div>
              </div>
            <div>
              <span onClick={closeFullImage}>X</span>
            </div>

            </div>
          )}

        <div className={imageStyles.sliderContainer}>
            <label htmlFor="column-slider"></label>
            <input 
              id="column-slider"
              type="range" 
              min="2" 
              max="15" 
              value={numColumns} 
              onChange={(e) => setNumColumns(e.target.value)}
            />
          </div>
          
          <div 
            className={imageStyles.imgGallery}
            style={{ '--num-columns': numColumns }}
          >
            {images.map((image, index) => (
              <img
                key={index}
                src={image.imageUrl}
                alt={`Image ${index}`}
                onClick={() => openFullImage(image)}
              />
            ))}
          </div>

          {isSignatureModalVisible && (
            <div className={imageStyles.signatureModal} onClick={closeSignatureModal}>
              <div className={imageStyles.signatureModalContent} onClick={e => e.stopPropagation()}>
                <span className={imageStyles.signatureModalClose} onClick={closeSignatureModal}>&times;</span>
                <pre>{fullImageJson['Signature_Base64']}</pre>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
