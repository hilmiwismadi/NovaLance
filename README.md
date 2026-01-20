# NovaLance

A modern freelance platform built with Next.js, designed to connect project owners with skilled freelancers.

## Features

- **Dual Dashboard**: Separate views for freelancers and project owners
- **Job Marketplace**: Browse and filter available opportunities
- **Job Creation**: Create new job postings with milestones
- **Milestone Tracking**: Track project progress with milestone-based payments
- **Responsive Design**: Mobile-first design with bottom navigation
- **Real-time Stats**: Track earnings, completed jobs, and active projects

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hilmiwismadi/NovaLance.git
cd NovaLance
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
NovaLance/
├── app/                    # Next.js app router pages
│   ├── jobs/              # Jobs listing and detail pages
│   ├── create-job/        # Job creation page
│   └── page.tsx           # Home/dashboard page
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   ├── jobs/              # Job-related components
│   ├── layout/            # Layout components (Header, BottomNav)
│   └── ui/                # Reusable UI components
├── lib/
│   ├── mockData.ts        # Mock data for development
│   └── utils.ts           # Utility functions
└── Context/               # Project documentation
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
