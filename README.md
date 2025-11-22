☁️ Lumina

<img width="1866" height="991" alt="image" src="https://github.com/user-attachments/assets/cff5945a-3f65-4e4e-b280-992a4542a401" />


<div align="center">

The intelligent, cloud-synced note-taking application built for the modern web.

View Demo · Report Bug · Request Feature

</div>

✨ Features

Lumina isn't just another notes app. It's a full productivity suite equipped with AI, real-time collaboration, and rich media support.

🧠 AI-Powered Productivity

Smart Summarization: Instantly condense long notes into bullet points using Google Gemini.

Grammar Polish: Fix typos and improve tone with a single click.

AI Writer: Stuck? Let the AI continue writing your sentences for you.

🤝 Collaboration & Sharing

Real-time Sync: Changes update instantly across all devices.

Granular Permissions: Share notes via email with Viewer or Editor roles.

Live Updates: See edits from collaborators as they happen.

🎨 Rich Media Editor

Formatting: Bold, Italic, Underline, Lists, Alignments, and more.

Image Support: Upload local images, resize them, and align them (Left/Center/Right).

Sketching: Built-in canvas to draw diagrams or handwritten notes.

Voice Memos: Speech-to-text integration for quick dictation.

Custom Themes: Color-code your notes with a preset palette or custom HEX picker.

🛠 Power User Tools

Google Keep Import: Seamlessly import your .zip Takeout data (notes, labels, colors).

Data Export: Download notes as .txt, copy to clipboard, or email them directly.

Data Backup: Export your entire database to a JSON file.

Statistics: Real-time word, character, and reading time counters.

Dark Mode: Fully responsive UI with a beautiful dark theme.

🚀 Getting Started

Follow these steps to run Lumina locally on your machine.

Prerequisites

Node.js (v16 or higher)

npm or yarn

A Firebase Project

A Google AI (Gemini) API Key

Installation

Clone the repo

git clone [https://github.com/adamikoo/Lumina.git](https://github.com/adamikoo/Lumina.git)
cd Lumina


Install dependencies

npm install


Configure Environment Variables
Create a .env file in the root directory:

VITE_GEMINI_API_KEY=your_google_gemini_api_key


Setup Firebase

Create a project at console.firebase.google.com.

Enable Authentication (Email/Password, Google, Anonymous).

Enable Firestore Database.

Copy your firebase configuration keys into src/firebase.js.

Run the development server

npm run dev


📸 Screenshots

Dashboard

Rich Editor

<img src="https://www.google.com/search?q=https://via.placeholder.com/400x200%3Ftext%3DDashboard%2BView" width="400" />

<img src="https://www.google.com/search?q=https://via.placeholder.com/400x200%3Ftext%3DEditor%2BView" width="400" />

Dark Mode

Mobile View

<img src="https://www.google.com/search?q=https://via.placeholder.com/400x200%3Ftext%3DDark%2BMode" width="400" />

<img src="https://www.google.com/search?q=https://via.placeholder.com/400x200%3Ftext%3DMobile%2BResponsive" width="400" />

🛠 Tech Stack

Frontend: React.js, Vite

Styling: Tailwind CSS, Lucide React (Icons)

Backend: Firebase (Auth, Firestore)

AI: Google Generative AI SDK (Gemini 1.5 Flash)

Utilities: JSZip (Importing), React DOM Portals (Modals)

🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

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
