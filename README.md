<div align="center">
<p>
<a href="https://noteapp-adamikoo.web.app/">
<img src="https://img.shields.io/badge/Google%20Chrome-4285F4?style=for-the-badge&logo=GoogleChrome&logoColor=white" alt="App Link" />
</a>
<a href="https://buymeacoffee.com/adamikoo">
<img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy me a coffee" />
</a>
</p>

<img width="150" height="150" alt="favicon" src="https://github.com/user-attachments/assets/63a8a291-68ae-4a0c-9a59-3fb927b4af71" />

☁️ Lumina Notes

The intelligent, cloud-synced note-taking application built for the modern web.

<!-- Tech Stack Badges -->

<p>
<a href="https://reactjs.org/">
<img src="https://img.shields.io/badge/-ReactJs-61DAFB?logo=react&logoColor=white&style=for-the-badge" alt="react"/>
</a>
<a href="https://vitejs.dev/">
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white" alt="vite"/>
</a>
<a href="https://tailwindcss.com/">
<img src="https://img.shields.io/badge/Tailwind_CSS-grey?style=for-the-badge&logo=tailwind-css&logoColor=38B2AC" alt="tailwind"/>
</a>
<a href="https://firebase.google.com/">
<img src="https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black" alt="firebase"/>
</a>
<a href="https://deepmind.google/technologies/gemini/">
<img src="https://img.shields.io/badge/DeepMind-4285F4?style=for-the-badge&logo=DeepMind&logoColor=FFFFFF" alt="gemini"/>
</a>
</p>

<!-- Quick Link Badges -->


</div>

<br />

<!-- Table of Contents -->

<details>
<summary><b>Table of Contents</b></summary>
<ol>
<li><a href="#-features">Features</a></li>
<li><a href="#-repository-structure">Repository Structure</a></li>
<li><a href="#-getting-started">Getting Started</a></li>
<li><a href="#-tech-stack">Tech Stack</a></li>
<li><a href="#-contributing">Contributing</a></li>
<li><a href="#-license">License</a></li>
</ol>
</details>

✨ Features

Lumina redefines the note-taking experience by combining a rich text editor with powerful AI tools and real-time collaboration.

Feature

Description

🧠 AI Intelligence

Powered by Google Gemini. Summarize notes, fix grammar, or let the AI auto-complete your sentences.

☁️ Cloud Sync

Built on Firestore. Notes update instantly across all devices in real-time.

🎨 Rich Media

Full WYSIWYG editor. Support for images (resize/move), sketching canvas, and voice-to-text.

🤝 Collaboration

Share notes via email. Assign Viewer or Editor roles for granular permission control.

🔐 Secure Auth

Complete authentication system supporting Google Sign-In, Email/Password, and Guest access.

📦 Power Tools

Import from Google Keep (.zip), export to .txt/Email, and full JSON backups.

📂 Repository Structure

    └── Lumina/
        ├── public/
        │   ├── favicon.png
        │   └── manifest.json
        ├── src/
        │   ├── utils/
        │   │   └── keepImport.js
        │   ├── App.jsx
        │   ├── firebase.js
        │   ├── index.css
        │   └── main.jsx
        ├── .env
        ├── index.html
        ├── package.json
        ├── postcss.config.js
        ├── tailwind.config.js
        └── vite.config.js


🚀 Getting Started

Follow these steps to get a local copy up and running.

Prerequisites

Node.js (v16 or higher)

npm

A Firebase Project (Free tier is sufficient)

A Google AI Studio API Key

Installation

Clone the repository

git clone [https://github.com/adamikoo/Lumina.git](https://github.com/adamikoo/Lumina.git)
cd Lumina


Install dependencies

npm install


Configure Environment
Create a .env file in the root directory and add your keys:

VITE_GEMINI_API_KEY=your_google_gemini_api_key


Setup Firebase

Create a project at console.firebase.google.com.

Enable Authentication (Email, Google, Anonymous).

Enable Firestore Database.

Create src/firebase.js and paste your config object.

Start the App

npm run dev


📸 Screenshots

<div align="center">
<img width="800" alt="Dashboard" src="https://github.com/user-attachments/assets/a4c0818b-671e-43b8-920b-0310d75e5252" />







<img width="800" alt="Editor" src="https://github.com/user-attachments/assets/06d017e6-1ae1-488d-b98a-bc397edf33be" />
</div>

🛠 Tech Stack

Framework: React + Vite

Styling: Tailwind CSS

Icons: Lucide React

Backend: Firebase (Auth & Firestore)

AI Model: Google Gemini 1.5 Flash

Utilities: jszip (Imports), react-dom (Portals)

🤝 Contributing

Contributions make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License

Distributed under the MIT License. See LICENSE for more information.

<div align="center">

Created with ❤️ by Adamikoo

</div>
