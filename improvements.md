# Future Improvements

## Logging & Observability
- [ ] **Add HTTP Request Logging**: Install and configure `morgan` in the Node.js backend (`server/index.js`) to explicitly log incoming HTTP requests (like the `/health` checks or `/api/products` ping) to the console. This will make it much easier to visually monitor uptime and traffic on cloud platforms like Render.
