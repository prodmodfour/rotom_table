# Remote Access Setup Guide

This guide explains how to set up remote access so players can connect to your Rotom Table from outside your local network using Cloudflare Tunnel.

## Overview

```
[Player Browser] --HTTPS/WSS--> [Cloudflare Edge] <--tunnel--> [cloudflared] --> [Nitro Server :3000] --> [SQLite]
```

- **LAN access** works out of the box (players on the same Wi-Fi/network)
- **Remote access** requires a Cloudflare Tunnel to securely expose your local server
- Cloudflare's free tier provides unlimited tunnels with auto-HTTPS

## Prerequisites

- A free Cloudflare account: https://dash.cloudflare.com/sign-up
- A domain name configured with Cloudflare DNS (free plan is fine)
- The Rotom Table server running on your machine

## Step 1: Install cloudflared

### Windows
```powershell
winget install cloudflare.cloudflared
```

### macOS
```bash
brew install cloudflared
```

### Linux (Debian/Ubuntu)
```bash
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared
```

## Step 2: Authenticate cloudflared

```bash
cloudflared tunnel login
```

This opens a browser window. Select your Cloudflare domain and authorize.

## Step 3: Create a Tunnel

```bash
cloudflared tunnel create ptu-session
```

This creates a tunnel and outputs a tunnel ID. Note it down.

## Step 4: Configure the Tunnel

Create a config file at `~/.cloudflared/config.yml`:

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: ~/.cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  - hostname: ptu.yourdomain.com
    service: http://localhost:3000
    originRequest:
      # WebSocket support (required for real-time sync)
      noTLSVerify: false
      connectTimeout: 30s
      # Keep connections alive for WebSocket
      keepAliveTimeout: 90s
  - service: http_status:404
```

Replace:
- `<YOUR_TUNNEL_ID>` with the tunnel ID from Step 3
- `ptu.yourdomain.com` with your chosen subdomain

## Step 5: Create DNS Route

```bash
cloudflared tunnel route dns ptu-session ptu.yourdomain.com
```

This creates a CNAME record pointing your subdomain to the tunnel.

## Step 6: Run the Tunnel

```bash
cloudflared tunnel run ptu-session
```

Your server is now accessible at `https://ptu.yourdomain.com`.

## Step 7: Configure in the App

1. Open the GM View
2. Click the **Connect** button in the top-right header
3. Click **Configure** under the Tunnel section
4. Enter your tunnel URL (e.g., `https://ptu.yourdomain.com`)
5. Click the save button

Players can now use the tunnel URL to connect remotely.

## Auto-Start on Boot (Optional)

### Windows
```powershell
cloudflared service install
```

### Linux (systemd)
```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### macOS (launchd)
```bash
sudo cloudflared service install
```

## Cloudflare Free Tier Limits

- **Idle timeout**: 100 seconds (the app sends keepalive pings every 45s to prevent this)
- **Tunnels**: Unlimited
- **Bandwidth**: No hard limit on free tier
- **HTTPS**: Automatic (Cloudflare provides the certificate)

## Troubleshooting

### WebSocket disconnects frequently
- The app already handles keepalive pings (every 45s) to prevent Cloudflare's 100s idle timeout
- Tunnel connections get 10 reconnect attempts (vs 5 for LAN) with exponential backoff
- Check `cloudflared` logs for connection issues: `cloudflared tunnel run --loglevel debug ptu-session`

### Players see "Connection lost" banner
- Verify `cloudflared` is running on the GM machine
- Check that the tunnel hostname resolves: `nslookup ptu.yourdomain.com`
- Players can click **Retry** in the connection status dropdown

### "502 Bad Gateway" errors
- Make sure the Rotom Table server is running on port 3000
- Check that `config.yml` points to the correct `localhost:3000`

### Vite HMR not working through tunnel (development only)
- In `nuxt.config.ts`, uncomment the Vite HMR config section and set your tunnel hostname
- HMR through tunnel adds latency; for active development, prefer LAN access

## Network Architecture

### LAN Connection (Default)
```
Player --HTTP--> GM Machine:3000 (direct)
```

### Tunnel Connection (Remote)
```
Player --HTTPS--> Cloudflare Edge --tunnel--> cloudflared --HTTP--> localhost:3000
```

Both connections work simultaneously. Players on the same network can use either the LAN IP or the tunnel URL. The app automatically detects the connection type and adjusts reconnection behavior accordingly.
