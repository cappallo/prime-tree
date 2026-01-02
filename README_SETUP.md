How to Run "Prime Dendrochronology" Locally

You need Node.js installed. If you don't have it, go get it.

1. Scaffold the Project

Open your terminal and run this to create a clean React project using Vite:

npm create vite@latest prime-tree -- --template react
cd prime-tree
npm install


2. Install Dependencies

You need Tailwind CSS (for the styling) and Lucide (for the icons).

# Install Tailwind and its peers
npm install -D tailwindcss postcss autoprefixer

# Install the icon library
npm install lucide-react


3. Initialize Tailwind

Generate the config files:

npx tailwindcss init -p


Now, open tailwind.config.js and replace the content array so it actually looks for your files:

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}


Then, open src/index.css and delete everything, replacing it with these three lines:

@tailwind base;
@tailwind components;
@tailwind utilities;


4. Drop in the Code

Open src/App.jsx. Delete everything in there. Paste the entire contents of the prime_tree.jsx file I generated for you into src/App.jsx.

5. Run it

Fire it up locally:

npm run dev


Open the localhost link it gives you. It should work immediately.

6. Deploying to a Real Server

If you want to host this on Nginx, Apache, or Vercel/Netlify:

Run npm run build.

This creates a dist folder.

Upload the contents of dist to your server's public HTML folder. That's it. It's just static HTML/JS/CSS at that point.