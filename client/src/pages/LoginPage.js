import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle, loginWithFacebook } = useAuth();
    const navigate = useNavigate();

    const handleGoogleCredentialResponse = async (response) => {
        setLoading(true);
        try {
            const user = await loginWithGoogle(response.credential);
            toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
            navigate(user.role === "admin" ? "/admin" : "/visualizer");
        } catch (err) {
            toast.error(err.response?.data?.error || "Google Sign-in failed");
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
                                `Welcome back, ${user.name.split(" ")[0]}!`,
                            );
                            navigate(
                                user.role === "admin"
                                    ? "/admin"
                                    : "/visualizer",
                            );
                        })
                        .catch((err) => {
                            toast.error(
                                err.response?.data?.error ||
                                    "Facebook Sign-in failed",
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

        // Initialize Google Sign-In
        const initializeGoogleSignIn = () => {
            if (window.google && active) {
                window.google.accounts.id.initialize({
                    client_id:
                        process.env.REACT_APP_GOOGLE_CLIENT_ID ||
                        "867552162537735-fakeclientid.apps.googleusercontent.com",
                    callback: handleGoogleCredentialResponse,
                });
                const btn = document.getElementById("google-signin-btn");
                if (btn) {
                    btn.innerHTML = ""; // Clear previous button if any
                    window.google.accounts.id.renderButton(btn, {
                        theme: "outline",
                        size: "large",
                        width: window.innerWidth < 400 ? 280 : 336,
                        text: "signin_with",
                    });
                }
            }
        };

        const checkAndInit = () => {
            if (window.google) {
                initializeGoogleSignIn();
            } else if (active) {
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
    }, [handleGoogleCredentialResponse]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
            navigate(user.role === "admin" ? "/admin" : "/visualizer");
        } catch (err) {
            if (
                err.response?.status === 403 &&
                err.response?.data?.unverified
            ) {
                toast.error(
                    "Email not verified. Redirecting to verification...",
                );
                navigate("/register", {
                    state: { email: err.response.data.email, step: "verify" },
                });
            } else {
                toast.error(err.response?.data?.error || "Login failed");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                background: "var(--cream)",
            }}
            className="login-container"
        >
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
            >
                <style>
                    {`
                        @media (max-width: 768px) {
                            .login-container {
                                grid-template-columns: 1fr !important;
                            }
                            .login-container > div:first-child {
                                display: none !important;
                            }
                        }
                    `}
                </style>
            </div>

            {/* Right side - Login Form */}
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
                        <h2>Sign in to Stratum</h2>
                        <p style={{ margin: "0.5rem 0 0" }}>
                            Access your visualizations and saved renders
                        </p>
                    </div>
                    <div className="card">
                        <form
                            onSubmit={handleSubmit}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                            }}
                        >
                            <div>
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            email: e.target.value,
                                        }))
                                    }
                                    placeholder="your@email.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                            <div>
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            password: e.target.value,
                                        }))
                                    }
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
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
                                        Signing in…
                                    </>
                                ) : (
                                    "Sign in"
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
                                id="google-signin-btn"
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
                    </div>
                    <p
                        style={{
                            textAlign: "center",
                            marginTop: "1.25rem",
                            fontSize: "0.875rem",
                        }}
                    >
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            style={{
                                color: "var(--gold-dark)",
                                fontWeight: 500,
                            }}
                        >
                            Create one free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
