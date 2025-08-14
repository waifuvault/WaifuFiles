# WaifuVault File Uploader

Simple application for uploading files to WaifuVault.

## Features

- Drag and drop file uploads
- One-click URL copying
- Beautiful gradient UI with glassmorphism effects
- Fast uploads with loading states
- Responsive design
- Environment variable configuration

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install the additional required dependency for file parsing:
```bash
npm install formidable
npm install --save-dev @types/formidable
```

3. Create a `.env.local` file in the root directory:
```bash
WAIFUVAULT_BUCKET_TOKEN=your_actual_bucket_token_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Either drag and drop a file onto the upload zone, or click to select a file
2. Wait for the upload to complete
3. Copy the generated URL to share your file

## Environment Variables

- `WAIFUVAULT_BUCKET_TOKEN`: Your WaifuVault bucket token (required)