import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["fluent-ffmpeg", "@ffprobe-installer/ffprobe"],
};

export default nextConfig;
