import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/login.module.css'; // Adjust the path as needed
// Other necessary imports...


export default function Verification() {
    const [verificationCode, setVerificationCode] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Trying to verify code with:", { verificationCode });

        // Make sure cognitoUser is defined and accessible here
        if (cognitoUser) {
            cognitoUser.confirmRegistration(verificationCode, true, function(err, result) {
                if (err) {
                    console.error("Verification failed:", err.message);
                    setErrorMessage(err.message);
                    return;
                }
                console.log("Verification successful, redirecting...");
                // Redirect to a different page after successful verification
                router.push('/'); // Replace with your login route
            });
        } else {
            setErrorMessage("User not found. Please restart the registration process.");
        }
    };

    return (
        <>
            <Head>
                <title>Verification Page</title>
            </Head>

            <div className={styles.titleContainer}>
                <h1 className={styles.pageTitle}>PhotoLock</h1>
            </div>
            <div className={styles.wrapper}>
                {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
                <form onSubmit={handleSubmit}>
                    <h1>Verify Email</h1>
                    <div className={styles.inputBox}>
                        <input type="text" placeholder="Verification Code" required
                            onChange={(e) => setVerificationCode(e.target.value)} />
                        <i className="bx bxs-lock-alt"></i>
                    </div>

                    <button type="submit" className={styles.btn}>Verify</button>
                </form>
            </div>
        </>
    );
}
