# Modern Call Manager

A modern web application for managing call templates/scripts and call reviews with a clean, responsive interface.

## Features

- **Templates Management**
  - Create, edit, and delete call templates/scripts
  - Copy templates to clipboard with one click
  - Real-time search functionality
  - Dynamic text wrapping for better readability

- **Call Reviews**
  - Log and track call reviews
  - Add links to call recordings
  - Rate call quality
  - Searchable review history

- **Modern UI/UX**
  - Clean, minimalist design
  - Responsive layout for all devices
  - Smooth animations and transitions
  - Intuitive navigation

## Tech Stack

- HTML5
- CSS3 (Tailwind CSS)
- JavaScript (Vanilla)
- Firebase (Firestore)

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Open `index.html` in your web browser.

3. The application uses Firebase for data storage. The Firebase configuration is already set up in `firebase-config.js`.

## Usage

### Templates Tab

1. Click "New Template" to create a call template
2. Fill in the template name and message
3. Use the search bar to find specific templates
4. Click the copy icon to copy a template to clipboard
5. Use edit and delete icons to manage templates

### Call Reviews Tab

1. Click "Log Call" to add a new call review
2. Fill in the date, recording link, description, and quality rating
3. Use the search bar to find specific reviews
4. Use edit and delete icons to manage reviews

## Development

The application is built with vanilla JavaScript and requires no build process. Simply edit the files and refresh your browser to see changes.

### File Structure

- `index.html` - Main application structure
- `app.js` - Core application logic
- `firebase-config.js` - Firebase configuration
- `styles.css` - Custom styles

## Security

- Delete operations require typing "DELETE" for confirmation
- Firebase security rules are configured to allow read/write access

## Browser Support

The application supports all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 