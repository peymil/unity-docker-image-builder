FROM docker:dind

# Install Node.js, pnpm, and build tools
RUN apk add --no-cache \
    nodejs \
    npm \
    git \
    python3 \
    make \
    g++ \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code and build the app
COPY src/ ./src/
COPY tsconfig.json ./
RUN pnpm build

# The docker:dind entrypoint will start the Docker daemon, then run the CMD
CMD ["pnpm", "start"]