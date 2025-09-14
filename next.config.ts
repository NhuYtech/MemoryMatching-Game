import { resolve } from "path";

const nextConfig = {
  webpack(config: { resolve: { alias: { [x: string]: string; }; }; }) {
    config.resolve.alias['@'] = resolve(__dirname, 'src');
    return config;
  },
};

export default nextConfig;
