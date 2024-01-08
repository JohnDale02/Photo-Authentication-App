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

    // Filter for PNG files
    var pngFiles = data.Contents.filter(function(file) {
        return file.Key.endsWith('.png');
    });

    var href = this.request.httpRequest.endpoint.href;
    var bucketUrl = href + bucketName + "/";

    var photos = pngFiles.map(function(photo) {
        var photoKey = photo.Key;
        var photoUrl = bucketUrl + encodeURIComponent(photoKey);
        return {
            key: photoKey,
            url: photoUrl
        };
    });
    setImages(photos);
  });
}

export default function Login() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [images, setImages] = useState([]);
  const [fullImage, setFullImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFullImageVisible, setIsFullImageVisible] = useState(false);

  const openFullImage = (src) => {
    setFullImage(src);
    setIsFullImageVisible(true);
  };
  const closeFullImage = () => {
    setFullImage(null);
    setIsFullImageVisible(false);
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
              <img src={fullImage} alt="Full Size" />
              <span onClick={closeFullImage}>X</span>
            </div>
          )}
          <div className={imageStyles.imgGallery}>
            {images.map((image, index) => (
              <img
                key={index}
                src={image.url}
                alt={image.key}
                onClick={() => openFullImage(image.url)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
