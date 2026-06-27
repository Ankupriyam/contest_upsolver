# Contest Upsolver 🏆

A sleek and lightning-fast web application designed for competitive programmers to easily discover, track, and solve problems they missed during live Codeforces contests. 

By analyzing your Codeforces rating history and submissions, Contest Upsolver instantly curates a personalized dashboard of unattempted or unsolved problems from past contests, allowing you to filter by rating, tags, and specific events to sharpen your skills efficiently.

## ✨ Features

- **Personalized Dashboard:** Enter your Codeforces handle to instantly sync your contest history and submissions.
- **Smart Filtering:** Filter unsolved problems by specific rating bounds, problem tags (e.g., `dp`, `graphs`), and individual contests.
- **Real-time Status Tracking:** Automatically differentiates between problems you've successfully `Solved`, `Attempted` (but failed), and remain `Unattempted`.
- **Lightning Fast Performance:** Uses a highly-optimized bulk API fetching strategy to avoid Codeforces rate limits and load your entire history in milliseconds.
- **Beautiful UI:** A dynamic, premium user interface with interactive elements, smooth animations, and a rich dark-mode aesthetic.

## 🚀 Tech Stack

- **Frontend:** React, Tailwind CSS, Framer Motion, Radix UI Primitives, Lucide Icons
- **Routing & SSR:** TanStack Router, TanStack Start
- **Build Tool:** Vite
- **Server / Deployment:** Nitro (preconfigured for Cloudflare Workers / Pages)

## 🛠️ Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+) and npm installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/contest-upsolver.git
   cd contest-upsolver
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## 📦 Deployment (Vercel)

This project is deployed on Vercel.

1. **Build the production bundle:**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel:**
   ```bash
   npx vercel --prod
   ```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/contest-upsolver/issues) if you want to contribute.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
