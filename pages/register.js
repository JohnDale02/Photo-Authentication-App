import Head from 'next/head';
import React from 'react';
import styles from '../styles/login.module.css'; // Import as a module
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

getCurrentLoggedInSession();

function getCurrentLoggedInSession(){

    userPool = new CognitoUserPool(poolData);
    cognitoUser = userPool.getCurrentUser();


    if(cognitoUser != null){
        cognitoUser.getSession(function(err, session) {
            if (err) {
                console.log(err.message);

            } else{ // if no error getting session

                console.log('Session found! Logged in.');
                idToken = session.getIdToken().getJwtToken();
                getCognitoIdentityCredentials();

                cognitoUser.getUserAttributes(function(err, attributes){
                    if (err) {
                        console.log(err.message);
                    } else{
                        let cameraNumber = attributes.find(attr => attr.getName() === 'username');
                        if (cameraNumber){
                            globalCameraNumber = cameraNumber.getValue(); // Store camera number globally
                            console.log('Camera Number: ' + cameraNumber.getValue());
                        } else {
                            console.log('Camera Number not set.');
                        }
                    }
                });
            }
        });

    } else{
        console.log('Session expired. Please log in again.');
    }

}

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

export default function Register() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cameraNumber, setCameraNumber] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    const [cognitoUser, setCognitoUser] = useState(null);
    const[isVerifying, setIsVerifying] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const router = useRouter();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match!");
            return;
        }

        var attributeList = [];
        var dataEmail = {
            Name: 'email',
            Value: email
        };

        var attributeEmail = new CognitoUserAttribute(dataEmail);
        attributeList.push(attributeEmail);

        var dataCameraNumber = {
            Name: 'custom:camera_number',
            Value: cameraNumber
        };

        var attributeCameraNumber = new CognitoUserAttribute(dataCameraNumber);
        attributeList.push(dataCameraNumber);

        userPool.signUp(cameraNumber, password, attributeList, null, function(err, result) {
            if (err) {
                setErrorMessage("Unable to sign up with those credentials");
                return;
            } 
            setCognitoUser(result.user);
            setIsVerifying(true);
        });
    };

    const handleVerification = async (e) => {
        e.preventDefault();
        if(!cognitoUser){
            setErrorMessage("User not found. Please restart registration");
            return;
        }

        cognitoUser.confirmRegistration(verificationCode, true, (err, result) => {
            if (err) {
                setErrorMessage(err.message);
                return;
            }
            console.log("Verification successful, redirecting...");
            // Redirect to a different page after successful verification
            router.push('/'); // Replace with your login route
        });
    };
    
    return (
    <>
      <Head>
        <title>{isVerifying ? "Verify Email" : "Register"}</title>
      </Head>

      <div className={styles.titleContainer}>
        <h1 className={styles.pageTitle}>PhotoLock</h1>
      </div>
      <div className={styles.wrapper}>
      {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
        {!isVerifying ? (
        <form onSubmit={handleRegister}>
          <h1>Create account</h1>
          <div className={styles.inputBox}>
            <input type="text" placeholder="Email" required 
                onChange={(e) => setEmail(e.target.value)}/>
            <i className="bx bxs-user"></i>
          </div>

          <div className={styles.inputBox}>
            <input type="cameraNumber" placeholder="Enter Camera Number" required 
                onChange={(e) => setCameraNumber(e.target.value)}/>
            <i className='bx bx-code-alt'></i>
          </div>


          <div className={styles.inputBox}>
            <input type="password" placeholder="Password" required 
                onChange={(e) => setPassword(e.target.value)}/>
            <i className="bx bxs-lock-alt"></i>
          </div>

          <div className={styles.inputBox}>
            <input type="password" placeholder="Confirm Password" required
                onChange={(e) => setConfirmPassword(e.target.value)}/>
            <i className="bx bxs-lock-alt"></i>
          </div>
          <button type="submit" className={styles.btn}>Sign Up</button>

        </form>
        ) : (
        <form onSubmit={handleVerification}>
            <h1>Verify Email</h1>
            <div className={styles.inputBox}>
                <input type="code" placeholder="Verification Code" required
                    onChange={(e) => setVerificationCode(e.target.value)} />
               <i className='bx bx-barcode'></i>
            </div>

            <button type="submit" className={styles.btn}>Verify</button>
        </form>
        )}
      </div>
    </>
  );
}
