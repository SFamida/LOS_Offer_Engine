/** @type {import('next').NextConfig} */

// Allow self-signed / corporate proxy certificates for DB connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const nextConfig = {};

export default nextConfig;
