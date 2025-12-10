# Seating Planner

A React-based interactive seating planner application for classroom management.

## Features

- Interactive drag-and-drop seating arrangement
- Student tier management system
- Import/export seating configurations
- Print-friendly layouts
- Responsive design for desktop and mobile
- Teacher and student view modes

## Live Demo

The application is automatically deployed to GitHub Pages at: https://iketsuki.github.io/seatingplanner/

## Development

### Prerequisites

- Node.js 20.x or higher
- npm

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Iketsuki/seatingplanner.git
cd seatingplanner
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

To create a production build:
```bash
npm run build
```

The build output will be in the `dist` directory.

### Preview Production Build

To preview the production build locally:
```bash
npm run preview
```

## Deployment

The application is automatically deployed to GitHub Pages when changes are pushed to the `main` branch using GitHub Actions.

### Manual Deployment

You can also trigger a deployment manually from the GitHub Actions tab.

### GitHub Pages Setup

1. Go to your repository Settings > Pages
2. Under "Build and deployment", select "GitHub Actions" as the source
3. The site will be deployed automatically on the next push to `main`

## Technology Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **Tailwind CSS** - Styling (via CDN)

## Project Structure

```
seatingplanner/
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions deployment workflow
├── src/
│   ├── SeatingPlanner.jsx  # Main seating planner component
│   ├── main.jsx            # Application entry point
│   └── index.css           # Global styles
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
└── package.json            # Project dependencies
```

## License

ISC
