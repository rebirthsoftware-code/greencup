# 🌿 GreenCup

> Sustainable packaging for a better tomorrow.

A modern, animation-rich landing page for **GreenCup** — a brand of 100% compostable, plant-based coffee cups and food packaging. Built with React + Vite and powered by smooth scrolling, scroll-driven GSAP animations, and a 3D falling-leaves hero scene.

## ✨ Features

- **Smooth scrolling** with [Lenis](https://github.com/darkroomengineering/lenis) for a fluid, premium feel.
- **Scroll-driven animations** using [GSAP](https://gsap.com/) + `ScrollTrigger`, including a **pinned horizontal-scroll product catalog**.
- **3D hero scene** — instanced, wind-swaying falling leaves rendered with [Three.js](https://threejs.org/) via `@react-three/fiber` and `@react-three/drei`.
- **Custom animated cursor** with contextual `data-hover` labels (DRAG, READ, BUY, …).
- **WhatsApp ordering** — product cards and the navbar deep-link to `wa.me` so customers can order with a pre-filled message.
- **Data-driven catalog** — products are defined in [`src/data/products.json`](src/data/products.json), so adding an item needs no component changes.
- Section components: Navbar · Hero · Eco Features · Categories · Product Catalog · Testimonials · FAQ.

## 🛠 Tech Stack

| Area | Tooling |
|------|---------|
| Framework | React 19 |
| Build tool | Vite 8 |
| Animation | GSAP + ScrollTrigger, Framer Motion |
| Smooth scroll | Lenis |
| 3D | Three.js, @react-three/fiber, @react-three/drei |
| Image utils | Jimp |
| Linting | ESLint 9 (flat config) |

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ (20+ recommended)

### Install & run

```bash
# install dependencies
npm install

# start the dev server (http://localhost:5173)
npm run dev

# build for production into dist/
npm run build

# preview the production build locally
npm run preview

# lint
npm run lint
```

## 📁 Project Structure

```
greencup/
├── public/                 # static assets (favicon, leaf.png, icons)
├── src/
│   ├── assets/             # images (hero, logos)
│   ├── components/         # Navbar, HeroSlider, EcoFeatures, Categories,
│   │                       # ProductCatalog, Testimonials, FAQ,
│   │                       # CustomCursor, FallingLeaves (+ matching .css)
│   ├── data/products.json  # product catalog source of truth
│   ├── App.jsx             # layout, Lenis + GSAP setup
│   └── main.jsx            # React entry point
├── process_leaf.cjs        # one-off asset helper (see note below)
├── process_leaf.py         # Python variant of the same helper
├── index.html
└── vite.config.js
```

## ⚙️ Configuration Notes

- **WhatsApp number** — currently a placeholder (`905000000000`) in `src/components/Navbar.jsx` and `src/components/ProductCatalog.jsx`. Replace it with the real business number before going live.
- **Products** — edit [`src/data/products.json`](src/data/products.json) to add, remove, or restyle items. Each entry supports a `color`, `features` list, and a `modelPath`.
- **3D product models** — the `modelPath` fields point to placeholder `.glb` files (`/models/...`). They are reserved for a future 3D product viewer and are **not** loaded yet; the catalog currently shows colored placeholders. The only live 3D scene is the hero's falling leaves.
- **`process_leaf` scripts** — one-off utilities that use Jimp to strip the white background from a source leaf image and export `public/leaf.png` (the texture used by the falling-leaves effect). `process_leaf.cjs` contains a hardcoded local input path and is **not** part of the build — keep it for reference or update the path before re-running.

## 📜 License

This project is currently private (no license specified). Add a license file if you intend to distribute it.

---

<p align="center">Made with 🌱 for a greener tomorrow.</p>
