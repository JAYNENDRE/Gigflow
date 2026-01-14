FROM denoland/deno:latest

WORKDIR /app
USER deno

# Copy function source
COPY . .

# Expose the port the app will listen on
EXPOSE 8080

# Run the function. It reads PORT from environment (default 8000).
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--unstable", "index.ts"]
