import {
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from "firebase/auth";
import { FormEvent, useEffect, useState } from "react";
import { auth } from "../firebase";
import { Button } from "nextra/components";
import { FirebaseError } from "firebase/app";

const googleProvider = new GoogleAuthProvider();

export default function RegisterComponent() {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    async function registerWithGoogle() {
        const result = await signInWithPopup(auth, googleProvider);

        redirectToUserPage();
    }

    async function register() {
        try {
            const result = await createUserWithEmailAndPassword(
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

    useEffect(() => {
        if (auth.currentUser) {
            window.location.replace("/user");
        }
    });

    function redirectToUserPage() {
        window.location.replace("/user");
    }

    return (
        <div
            style={{
                display: "flex",
                minHeight: "500px",
                justifyContent: "center",
            }}
        >
            <div style={{ width: "50%" }}>
                <div className="nx-flex nx-flex-col nx-gap-4">
                    <form
                        className="nx-flex nx-flex-col nx-gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            register();
                        }}
                    >
                        <div>Register with an email</div>
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
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit">Register</Button>
                    </form>
                    <hr />
                    <div>
                        <Button
                            style={{ width: "100%" }}
                            onClick={() => registerWithGoogle()}
                        >
                            Register with Google
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
