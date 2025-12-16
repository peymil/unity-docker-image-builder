FROM node:18-slim

# Install Buildah
RUN apt-get update && apt-get install -y \
    buildah \
    && rm -rf /var/lib/apt/lists/*

# Configure Buildah registries
RUN mkdir -p /etc/containers && \
    echo '[registries.search]' > /etc/containers/registries.conf && \
    echo 'registries = ["docker.io"]' >> /etc/containers/registries.conf

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Start the application
CMD ["pnpm", "run", "start"]