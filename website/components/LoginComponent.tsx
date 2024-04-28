import {
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    signInWithEmailLink,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { Button } from "nextra/components";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { getBaseUrl } from "../resources/getBaseUrl";

const googleProvider = new GoogleAuthProvider();

export default function LoginComponent() {
    const [newName, setNewName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [userData, setUserData] = useState<{
        idToken: string;
        name: string;
        apiToken: string;
        email: string;
        registered: boolean;
    }>(null);

    async function loginWithGoogle() {
        const result = await signInWithPopup(auth, googleProvider);
    }

    async function signIn() {
        const actionCodeSettings = {};

        try {
            const result = await signInWithEmailAndPassword(
                auth,
                email,
                password,
            );
        } catch (e) {
            if (e instanceof FirebaseError) {
                alert(e.message);
            }
        }
    }

    async function logout() {
        await signOut(auth);
    }

    async function register() {
        const response = await fetch(getBaseUrl() + "/v1/users/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userData.idToken}`,
            },
            body: JSON.stringify({ newName }),
        });

        setUserData({ name: newName, ...userData });
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (userFirebase) => {
            if (userFirebase) {
                const idToken = await userFirebase.getIdToken();

                const response = await fetch(getBaseUrl() + "/v1/users/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ idToken: idToken }),
                });
                const user = await response.json();

                setUserData({
                    name: user.name,
                    idToken,
                    apiToken: user.token,
                    email: userFirebase.email,
                    registered: user.registered,
                });
            } else {
                setUserData(null);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <div
            style={{
                display: "flex",
                minHeight: "500px",
                justifyContent: "center",
            }}
        >
            <div style={{ width: "50%" }}>
                {userData == null ? (
                    <div className="nx-flex nx-flex-col nx-gap-4">
                        <form
                            className="nx-flex nx-flex-col nx-gap-2"
                            onSubmit={(e) => {
                                signIn();
                                e.preventDefault();
                            }}
                        >
                            <div>Sign with an email</div>
                            <div>
                                <input
                                    className="nx-block nx-w-full nx-appearance-none nx-rounded-lg nx-px-3 nx-py-2 nx-transition-colors nx-text-base nx-leading-tight md:nx-text-sm nx-bg-black/[.05] dark:nx-bg-gray-50/10 focus:nx-bg-white dark:focus:nx-bg-dark placeholder:nx-text-gray-500 dark:placeholder:nx-text-gray-400 contrast-more:nx-border contrast-more:nx-border-current"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <input
                                    className="nx-block nx-w-full nx-appearance-none nx-rounded-lg nx-px-3 nx-py-2 nx-transition-colors nx-text-base nx-leading-tight md:nx-text-sm nx-bg-black/[.05] dark:nx-bg-gray-50/10 focus:nx-bg-white dark:focus:nx-bg-dark placeholder:nx-text-gray-500 dark:placeholder:nx-text-gray-400 contrast-more:nx-border contrast-more:nx-border-current"
                                    type="password"
                                    autoComplete="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                            </div>

                            <Button type="submit">Sign in</Button>

                            <div className="nx-text-bottom">
                                <Link href="/register">Register</Link>
                            </div>
                        </form>
                        <div className="nx-flex nx-flex-row nx-items-center nx-gap-2">
                            <hr className="nx-w-full" /> <div>Or</div>{" "}
                            <hr className="nx-w-full" />
                        </div>
                        <div>
                            <Button
                                style={{ width: "100%" }}
                                onClick={() => loginWithGoogle()}
                            >
                                Login with Google
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="nx-flex nx-flex-col nx-gap-2">
                        <div>
                            Welcome <b>{userData.name}</b>
                        </div>
                        <div>
                            Email: <b>{userData.email}</b>
                        </div>
                        {!userData.registered && (
                            <div>
                                You can change your username (only once):
                                <input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                                <Button onClick={() => register()}>
                                    Confirm
                                </Button>
                            </div>
                        )}
                        <div>
                            API token:{" "}
                            <code className="nx-border-black nx-border-opacity-[0.04] nx-bg-opacity-[0.03] nx-bg-black nx-break-words nx-rounded-md nx-border nx-py-0.5 nx-px-[.25em] nx-text-[.9em] dark:nx-border-white/10 dark:nx-bg-white/10">
                                {userData.apiToken}
                            </code>
                        </div>
                        <div>
                            <Button onClick={() => logout()}>Log out</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
