/** @type {import('next').NextConfig} */
const nextConfig = {
    productionBrowserSourceMaps: false,
    serverRuntimeConfig: {
        maxRequestTimeouts: 300000,
    },
};

export default nextConfig;
