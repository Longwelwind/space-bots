const withNextra = require("nextra")({
    theme: "nextra-theme-docs",
    themeConfig: "./theme.config.tsx",
});

module.exports = withNextra({
    output: process.env.NODE_ENV == "development" ? undefined : "export",
    images: {
        unoptimized: true,
    },
    rewrites:
        process.env.NODE_ENV == "development"
            ? () => {
                  return [
                      {
                          source: "/v1/:path*",
                          destination: "http://localhost:8080/v1/:path*",
                      },
                  ];
              }
            : undefined,
});
