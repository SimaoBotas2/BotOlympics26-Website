# Bot Olympics Site

Currently only the main page for the Bot Olympics event, but has room to host other pages and services (e.g. leaderboard).

## Quick Start

### Development

1. **Start dev server:**
  ```bash
  npm install && npm ci && npm run check:i18n && npm run dev
  ```
  - `npm install` – Makes sure project dependencies are installed
  - `npm ci` – Clean install with locked versions for consistency
  - `npm run check:i18n` – Validate internationalization files (checks if both locale files have the same structure)
  - `npm run dev` – Start development server

  Site runs at `http://localhost:3000`


### Production (Docker)

1. **Edit environment:**
  ```bash
  # Copy template
  cp .env-example .env
  # Set your Docker network name
  # DOCKER_NETWORK=your_network_name
  ```

  This is used to not expose ports publicly, just internally in the docker network, so that the reverse proxy (e.g. Nginx, Traefik, Caddy) can route traffic by itself.

2. **Build and run:**
  ```bash
  sudo docker compose up --build --force-recreate -d
  ```
  - `--build`: Rebuild Docker images with your latest code
  - `--force-recreate`: Remove and recreate containers for a fresh start
  - `-d`: Run in detached mode (background)

  Site runs at `http://localhost:8080` (or configured port)


3. **Stop:**
  ```bash
  sudo docker compose down
  ```


---

## Editing Content

### Text & Translations

All site text lives in `/src/locales/`:
  - `pt.json` — Portuguese content
  - `en.json` — English content
  - add more languages by creating new JSON files (e.g. `es.json` for Spanish) and updating `i18n.js` to match

**To edit text:**
  1. Open `src/locales/pt.json` or `src/locales/en.json`
  2. Find the key (e.g., `"challenges"` → `"title"`)
  3. Change the value
  4. **In dev:** Changes reflect instantly (hot reload)
  5. **In production:** Redeploy the production docker (see **`Build and run`** section)


### Images

### **PROBLEMS WITH STORING IMAGES IN GIT**

The only possible problem that could arise is a storage issue. As files pushed to git repo remain in history, the repository size could grow significantly over time. To mitigate this, the images should be downscaled to reasonable sizes (e.g., max 1920px width for large images, 140x140px for avatars) and optimized for web (compressed).

Consider using these commands to downscale and compress images:
```bash
# Reduces "input.jpg" to max 1600x1600 while keeping aspect ratio and compressing to quality 5 (pretty good)
# Saves as "output.jpg".
ffmpeg -y -i ./input.jpg -vf "scale='min(1600,iw)':'min(1600,ih)':force_original_aspect_ratio=decrease" -q:v 5 ./output.jpg
```
```bash
# Reduce all images in a given folder (eg. gallery)
# Saves to images_small/ for manual replacement
mkdir -p ./images_small
for img in ./path/to/gallery/*; do
  [[ "$img" =~ \.(JPG|jpg|jpeg|png|gif|webp)$ ]] && ffmpeg -y -i "$img" -vf "scale='min(1920,iw)':'min(1440,ih)':force_original_aspect_ratio=decrease" -q:v 5 "./images_small/$(basename "$img")"
done
```

#### Static Assets
Place images in `/assets/` (organized by folder):
```
/assets/
  /logo.svg           # Simple logo
  /logo.png           # Logo with text
  /organization/      # Logos for the organizing entities
    NEEEC.png
  /2025/
    landing.jpg       # 2025 group photo
    /gallery/         # Previous edition gallery
      img1.jpg
      img2.png
  /2026/
    /challenges/      # Challenge-specific images
      /ISR/
        logo.png
        bg.jpg
    /sponsors/        # Sponsor logos for 2026
      /institutional/
        sponsor1.png
      /diamond/
        sponsor2.png
      /gold/
        sponsor3.png
      /silver/
        sponsor4.png
    /team/            # Team member photos
      Teo_do_açai.jpg
```

The photos are organized by year to avoid confusion when adding new editions. In principle, this system could support multiple years on the same site.

#### Dynamic Gallery (Previous Edition)

Gallery images are loaded from a folder at runtime, you don't need to rebuild and restart the docker when adding new images to the gallery:

**In development:**
1. Create `/assets/2025/gallery/`
2. Add `.jpg`, `.png`, `.webp`, etc.
3. Images auto-populate in the "Previous Edition" carousel

**In production (Docker):**
1. Mount the gallery folder in `docker-compose.yml`:
   ```yaml
   volumes:
     - ./assets/2025/gallery:/app/dist/assets/2025/gallery:rw
   ```
2. Drop images in `./assets/2025/gallery/` on the host
3. They appear in the carousel immediately (no restart needed)

**To change gallery path:**
- Edit `src/locales/pt.json` → `previousEdition.galleryPath`
- Example: `"/assets/2024/gallery"` → `"/assets/2025/gallery"`

---

## Runtime Configuration

Controlling the challenge enrollment states is usually a big problem. As we don't have a backend, and the enrollments are done via Google Forms, and manually counted and checked, we need a way to close/open enrollments instantly, without rebuilding the site.

### Registration States

Control challenge registration status via `/config/registrations.json`:

```json
{
  "isr": "before",        // "before" | "after" | "open"
  "botnroll": "open",
  "fctuc": "after"
}
```

**Effects:**
- `"before"` → Button shows "Inscrições em breve!" (Registrations open soon)
- `"open"` → Button shows "Inscrever" (Register) and links to form
- `"after"` → Button shows "Inscrições esgotadas" (Registrations full) and is disabled

**Editing:**
- **Dev:** Edit `config/registrations.json` and refresh
- **Production:** Mount and edit on the host; changes appear in ~5 seconds (client polls)

**Notes:**
- Challenge IDs are lowercase (e.g., `"isr"`, `"botnroll", `"fctuc"`)
- Make ***`ABSOLUTETLY`*** sure that the IDs match those in the locale files under `challenges` → each challenge object has an `id` field

---

## Team Section

### Add/Remove Members

Edit `src/locales/pt.json` and `src/locales/en.json`:

```json
"team": {
  "title": "A Nossa Equipa",
  "members": [
    {
      "name": "Tiago Furtado",
      "role": "Coordenador Geral (NEEEC/AAC)",
      "img": "/assets/team/Tiago_Furtado.jpg"
    }
  ]
}
```

1. Add new object to `members` array
2. Provide `name`, `role`, and `img` (path to avatar)
3. Avatar should be ~140×140px (square, will be circular)

---

## File Structure

```
BotOlympicsSite/
├── src/
│   ├── App.jsx               # Main app component
│   ├── main.jsx              # Entry point
│   ├── styles.css            # All styles
│   ├── i18n.js               # i18next setup
│   ├── locales/
│   │   ├── pt.json           # Portuguese content
│   │   └── en.json           # English content
│   └── components/
│       └── FaqList.jsx       # FAQ component
├── public/
│   └── index.html
├── config/
│   └── registrations.json    # Runtime challenge states
├── assets/                   # Static images (gallery, logos, team photos)
├── server.js                 # Node.js static server
├── vite.config.js            # Vite config (dev server, gallery endpoint)
├── Dockerfile                # Multi-stage build
├── docker-compose.yml        # Production setup
├── package.json
└── README.md                 # you are here :3
```

---

## API Endpoints

These are supposed to be used internally only. But because they are only GETs, theres no security risk.

### Development & Production

**Gallery listing:**
```
GET /_gallery?dir=/assets/2025/gallery
```
Returns JSON array of image URLs.

**Registration config:**
```
GET /_config/registrations.json
```
Returns current challenge states.

---

## Troubleshooting

### Images not showing
- Check path in locale JSON (must start with `/assets/`)
- Ensure file exists in `/assets/` folder
- In Docker, verify volume mount in `docker-compose.yml`

### Text not updating in production
- Restart Docker container: `docker-compose restart web`
- Or redeploy: `docker-compose up --build`

### Gallery carousel empty
- Confirm folder exists at path specified in `previousEdition.galleryPath`
- Verify images are `.jpg`, `.png`, `.webp`, `.gif`, `.svg`, or `.bmp`
- In Docker, check volume mount path

---

## Performance & Caching

- **HTML/CSS/JS:** No-cache in production (always fresh)
- **Static assets (images):** Cached with long TTL
- **Carousel animations:** GPU-accelerated, works on Safari 9+
- **Bundle size:** ~50KB gzipped (React + i18next + styles)