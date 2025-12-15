FROM node:24
ARG NODE_VERSION=24
WORKDIR /app
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Use bash for the shell
RUN apt update && apt install -y curl bash build-essential
RUN curl -fsSL https://get.docker.com | sh
# Create a script file sourced by both interactive and non-interactive bash shells
ENV BASH_ENV=/root/.bash_env
RUN touch "${BASH_ENV}"
RUN echo '. "${BASH_ENV}"' >> ~/.bashrc

# Download and install nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | PROFILE="${BASH_ENV}" bash
RUN echo node > .nvmrc

RUN source "${BASH_ENV}" && nvm install ${NODE_VERSION} && nvm use ${NODE_VERSION}

RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code and build the app
COPY src/ ./src/
COPY tsconfig.json ./
RUN pnpm build

# The docker:dind entrypoint will start the Docker daemon, then run the CMD
CMD ["pnpm", "start"]