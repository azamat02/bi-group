# Build stage
FROM node:20-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock for better caching
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of your application code
COPY . .

# Build the app
RUN yarn build

# Production stage
FROM nginx:alpine AS production

# Set the working directory to nginx asset directory
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy static assets from builder stage
COPY --from=build /app/dist .

# Copy the custom Nginx configuration file into the container
COPY default.conf /etc/nginx/nginx.conf

# Containers run nginx with global directives and daemon off
ENTRYPOINT ["nginx", "-g", "daemon off;"]
