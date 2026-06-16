FROM node:18-alpine

WORKDIR /workspace

# Copy dependency manifest files first for caching
COPY package.json package-lock.json* ./

# Install standard dependencies
RUN npm install

# Copy all local project files
COPY . .

# Expose Next.js default port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Default CMD runs the dev server
CMD ["npm", "run", "dev"]
