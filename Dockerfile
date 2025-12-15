FROM node:24
ARG NODE_VERSION=24

# Use bash for the shell
RUN apt update && apt install -y curl bash build-essential
RUN curl -fsSL https://get.docker.com | sh

RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code and build the app
COPY src/ ./src/
COPY tsconfig.json ./
COPY docker ./docker/
RUN pnpm build

# The docker:dind entrypoint will start the Docker daemon, then run the CMD
CMD ["pnpm", "start"]