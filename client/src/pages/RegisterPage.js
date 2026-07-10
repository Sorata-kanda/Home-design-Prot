import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
    const location = useLocation();
    const [form, setForm] = useState({
        name: "",
        email: location.state?.email || "",
        phone: "",
        city: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(location.state?.step || "register"); // 'register' or 'verify'
    const [otp, setOtp] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [timer, setTimer] = useState(0);
    const {
        register,
        loginWithGoogle,
        loginWithFacebook,
        verifyOTP,
        resendOTP,
    } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer((t) => t - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleGoogleCredentialResponse = async (response) => {
        setLoading(true);
        try {
            const user = await loginWithGoogle(response.credential);
            toast.success(`Welcome, ${user.name.split(" ")[0]}!`);
            navigate("/visualizer");
        } catch (err) {
            toast.error(err.response?.data?.error || "Google Sign-up failed");
        } finally {
            setLoading(false);
        }
    };

    const handleFacebookLogin = () => {
        if (!window.FB) {
            toast.error("Facebook SDK not loaded");
            return;
        }

        setLoading(true);
        window.FB.login(
            (response) => {
                if (response.authResponse) {
                    loginWithFacebook(response.authResponse.accessToken)
                        .then((user) => {
                            toast.success(
                                `Welcome, ${user.name.split(" ")[0]}!`,
                            );
                            navigate("/visualizer");
                        })
                        .catch((err) => {
                            toast.error(
                                err.response?.data?.error ||
                                    "Facebook Sign-up failed",
                            );
                        })
                        .finally(() => {
                            setLoading(false);
                        });
                } else {
                    setLoading(false);
                    toast.error("Facebook login cancelled");
                }
            },
            { scope: "public_profile,email" },
        );
    };

    useEffect(() => {
        let active = true;

        // Initialize Facebook SDK
        window.fbAsyncInit = function () {
            window.FB.init({
                appId:
                    process.env.REACT_APP_FACEBOOK_APP_ID ||
                    "your-facebook-app-id",
                cookie: true,
                xfbml: true,
                version: "v18.0",
            });
        };

        // Load Facebook SDK
        if (!document.getElementById("facebook-jssdk")) {
            const script = document.createElement("script");
            script.id = "facebook-jssdk";
            script.src = "https://connect.facebook.net/en_US/sdk.js";
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }

        // Initialize Google Sign-In only for register step
        const initializeGoogleSignIn = () => {
            if (window.google && step === "register" && active) {
                window.google.accounts.id.initialize({
                    client_id:
                        process.env.REACT_APP_GOOGLE_CLIENT_ID ||
                        "867552162537735-fakeclientid.apps.googleusercontent.com",
                    callback: handleGoogleCredentialResponse,
                });
                const btn = document.getElementById("google-signup-btn");
                if (btn) {
                    btn.innerHTML = "";
                    window.google.accounts.id.renderButton(btn, {
                        theme: "outline",
                        size: "large",
                        width: window.innerWidth < 400 ? 280 : 336,
                        text: "signup_with",
                    });
                }
            }
        };

        const checkAndInit = () => {
            if (window.google) {
                initializeGoogleSignIn();
            } else if (active && step === "register") {
                setTimeout(checkAndInit, 100);
            }
        };

        if (!document.getElementById("google-gsi-script")) {
            const script = document.createElement("script");
            script.id = "google-gsi-script";
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = checkAndInit;
            document.body.appendChild(script);
        } else {
            checkAndInit();
        }
        return () => {
            active = false;
        };
    }, [step]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setLoading(true);
        try {
            await register(form);
            toast.success("Verification code sent to your email!");
            setStep("verify");
            setTimer(60);
        } catch (err) {
            toast.error(err.response?.data?.error || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error("Please enter a 6-digit verification code");
            return;
        }
        setVerifying(true);
        try {
            await verifyOTP(form.email, otp);
            toast.success("Email verified successfully! Welcome!");
            navigate("/visualizer");
        } catch (err) {
            toast.error(err.response?.data?.error || "Verification failed");
        } finally {
            setVerifying(false);
        }
    };

    const handleResendCode = async () => {
        if (timer > 0) return;
        try {
            await resendOTP(form.email);
            toast.success("New verification code sent!");
            setTimer(60);
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to resend code");
        }
    };

    const set = (field) => (e) =>
        setForm((f) => ({ ...f, [field]: e.target.value }));

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                background: "var(--cream)",
            }}
            className="register-container"
        >
            <style>
                {`
          @media (max-width: 768px) {
            .register-container {
              grid-template-columns: 1fr !important;
            }
            .register-container > div:first-child {
              display: none !important;
            }
          }
        `}
            </style>

            {/* Left side - Stratum Home Image */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    backgroundImage: "url(/images/Stratum_login.png)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            ></div>

            {/* Right side - Registration Form */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2rem 1rem",
                }}
            >
                <div style={{ width: "100%", maxWidth: 400 }}>
                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <h2>Create your account</h2>
                        <p style={{ margin: "0.5rem 0 0" }}>
                            Save renders, track quotes, share with clients
                        </p>
                    </div>
                    <div className="card">
                        {step === "register" ? (
                            <>
                                <form
                                    onSubmit={handleSubmit}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.875rem",
                                    }}
                                >
                                    <div>
                                        <label>Full name *</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={set("name")}
                                            required
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div className="form-grid-2">
                                        <div>
                                            <label>Email *</label>
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={set("email")}
                                                required
                                                placeholder="you@email.com"
                                            />
                                        </div>
                                        <div>
                                            <label>Phone</label>
                                            <input
                                                type="tel"
                                                value={form.phone}
                                                onChange={set("phone")}
                                                placeholder="+91 98xxx xxxxx"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label>City</label>
                                        <input
                                            type="text"
                                            value={form.city}
                                            onChange={set("city")}
                                            placeholder="Ludhiana, Tarn Taran…"
                                        />
                                    </div>
                                    <div>
                                        <label>Password *</label>
                                        <input
                                            type="password"
                                            value={form.password}
                                            onChange={set("password")}
                                            required
                                            placeholder="At least 6 characters"
                                            minLength={6}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary btn-lg"
                                        style={{
                                            justifyContent: "center",
                                            marginTop: 4,
                                        }}
                                    >
                                        {loading ? (
                                            <>
                                                <div
                                                    className="spinner"
                                                    style={{
                                                        width: 18,
                                                        height: 18,
                                                        borderWidth: 2,
                                                    }}
                                                />{" "}
                                                Creating account…
                                            </>
                                        ) : (
                                            "Create account"
                                        )}
                                    </button>
                                </form>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        margin: "1.25rem 0",
                                        gap: "0.75rem",
                                    }}
                                >
                                    <div
                                        style={{
                                            flex: 1,
                                            height: "1px",
                                            background: "var(--border)",
                                        }}
                                    ></div>
                                    <span
                                        style={{
                                            fontSize: "0.75rem",
                                            color: "var(--charcoal-light)",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        or
                                    </span>
                                    <div
                                        style={{
                                            flex: 1,
                                            height: "1px",
                                            background: "var(--border)",
                                        }}
                                    ></div>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.75rem",
                                        width: "100%",
                                    }}
                                >
                                    <div
                                        id="google-signup-btn"
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            width: "100%",
                                        }}
                                    ></div>

                                    <button
                                        onClick={handleFacebookLogin}
                                        disabled={loading}
                                        className="btn btn-secondary"
                                        style={{
                                            justifyContent: "center",
                                            width: "100%",
                                            background: "#1877F2",
                                            color: "white",
                                            border: "none",
                                        }}
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            style={{ marginRight: "8px" }}
                                        >
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                        Continue with Facebook
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1.25rem",
                                }}
                            >
                                <div style={{ textAlign: "center" }}>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: "0.875rem",
                                            color: "var(--charcoal-light)",
                                        }}
                                    >
                                        We sent a 6-digit code to{" "}
                                        <strong>{form.email}</strong>.
                                    </p>
                                </div>
                                <form
                                    onSubmit={handleVerify}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "1rem",
                                    }}
                                >
                                    <div>
                                        <label
                                            style={{
                                                textAlign: "center",
                                                display: "block",
                                                marginBottom: "0.5rem",
                                            }}
                                        >
                                            Enter verification code
                                        </label>
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) =>
                                                setOtp(
                                                    e.target.value
                                                        .replace(/\D/g, "")
                                                        .slice(0, 6),
                                                )
                                            }
                                            placeholder="123456"
                                            required
                                            maxLength={6}
                                            style={{
                                                fontSize: "1.5rem",
                                                letterSpacing: "8px",
                                                textAlign: "center",
                                                fontWeight: "bold",
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={verifying}
                                        className="btn btn-primary btn-lg"
                                        style={{ justifyContent: "center" }}
                                    >
                                        {verifying ? (
                                            <>
                                                <div
                                                    className="spinner"
                                                    style={{
                                                        width: 18,
                                                        height: 18,
                                                        borderWidth: 2,
                                                    }}
                                                />{" "}
                                                Verifying…
                                            </>
                                        ) : (
                                            "Verify Email"
                                        )}
                                    </button>
                                </form>
                                <div
                                    style={{
                                        textAlign: "center",
                                        fontSize: "0.8125rem",
                                    }}
                                >
                                    {timer > 0 ? (
                                        <span
                                            style={{
                                                color: "var(--charcoal-light)",
                                            }}
                                        >
                                            Resend code in {timer}s
                                        </span>
                                    ) : (
                                        <button
                                            onClick={handleResendCode}
                                            className="btn btn-link"
                                            style={{
                                                fontSize: "0.8125rem",
                                                padding: 0,
                                            }}
                                        >
                                            Resend verification code
                                        </button>
                                    )}
                                </div>
                                <div
                                    style={{
                                        textAlign: "center",
                                        marginTop: "0.5rem",
                                    }}
                                >
                                    <button
                                        onClick={() => setStep("register")}
                                        className="btn btn-ghost btn-sm"
                                    >
                                        ← Back to registration
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <p
                        style={{
                            textAlign: "center",
                            marginTop: "1.25rem",
                            fontSize: "0.875rem",
                        }}
                    >
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            style={{
                                color: "var(--gold-dark)",
                                fontWeight: 500,
                            }}
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
