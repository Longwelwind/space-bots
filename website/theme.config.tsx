import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";
import logo from "./public/spaceship.svg";
import favicon from "./public/favicon.png";
import Image from "next/image";

const config: DocsThemeConfig = {
    logo: (
        <div style={{ display: "flex", alignItems: "center" }}>
            <Image
                unoptimized={true}
                width={36}
                height={36}
                src={logo}
                alt="logo's of space bots: a space ship"
            />
            <span style={{ marginLeft: "8px" }}>Space Bots</span>
        </div>
    ),
    gitTimestamp: null,
    head: <link rel="icon" href={"/favicon.png"} />,
    project: {
        link: "https://github.com/Longwelwind/space-bots",
    },
    chat: {
        link: "https://discord.gg/5AmxHqZnqJ",
    },
    docsRepositoryBase: "https://github.com/Longwelwind/space-bots/website",
    footer: {
        text: "Space Bots",
    },
};

export default config;
