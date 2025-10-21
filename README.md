# Torrent Downloader Script

This is a Node.js script for downloading torrents from magnet links. It supports selective file downloading, creates dedicated folders for each torrent, adds public trackers for better speed, and provides real-time progress updates. Built with WebTorrent, it's lightweight and runs in the console.

## Features
- Paste a magnet link to start downloading.
- Fetches torrent metadata and lists files for selective download (e.g., choose specific files or "all").
- Automatically creates a new folder in `~/Downloads/Torrents` based on the torrent name.
- Adds reliable public trackers to improve peer discovery and download speeds.
- Precise piece selection to minimize downloading unwanted files.
- Progress tracking: Shows percentage, downloaded size, speed, time left, and peers.
- Error handling for invalid links, no peers, and interruptions (e.g., Ctrl+C for graceful shutdown).
- Custom completion check for selective downloads (since WebTorrent's 'done' event may not trigger perfectly).

## Prerequisites
- Node.js (version 14+ recommended; tested on v22+).
- A stable internet connection (torrents rely on peers/seeders).
- Optional: VPN to bypass ISP throttling for faster speeds.

## Installation
1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org/) if not already installed. Verify with `node -v`.

2. **Create a Project Directory**:
   ```
   mkdir torrent-downloader
   cd torrent-downloader
   ```

3. **Initialize the Project**:
   ```
   npm init -y
   ```
   This creates a `package.json` file.

4. **Install Dependencies**:
   The script uses ES Modules, so add `"type": "module"` to your `package.json`:
   ```json
   {
     "type": "module",
     // ... other fields
   }
   ```
   Install the main library:
   ```
   npm install webtorrent
   ```
   No other dependencies are needed (built-in Node modules like `readline`, `path`, `os`, and `fs` are used).

5. **Save the Script**:
   Copy the provided script into a file named `torrent-downloader.js` in your project directory.

## Usage
1. **Run the Script**:
   ```
   node torrent-downloader.js
   ```

2. **Paste Magnet Link**:
   - When prompted: "Paste your magnet link here:", paste a valid magnet URI (starts with `magnet:`) and press Enter.
   - The script fetches metadata, lists files, and asks for selection (e.g., "1,3-5" for files 1,3,4,5; or "all").

3. **Download Process**:
   - It creates a folder like `~/Downloads/Torrents/Torrent_Name`.
   - Shows progress every 5 seconds.
   - Completes when selected files are downloaded, then exits.

4. **Interrupt**:
   - Press Ctrl+C to shut down gracefully (stops downloads and cleans up).

5. **Example Output**:
   ```
   Paste your magnet link here: magnet:?xt=urn:btih:...
   Fetching metadata...
   Added public trackers to magnet URI.
   
   Torrent metadata loaded.
   Name: Example Torrent
   Files: 5
   Total size: 100.00 MB
   Piece length: 512.00 KB
   
   Files:
   1: file1.mp4 (50.00 MB)
   2: file2.txt (1.00 MB)
   ...
   
   Enter file numbers to download (comma-separated, e.g., 1,3-5, or "all"): 1
   Selected files: 1
   Created new download folder: /Users/yourname/Downloads/Torrents/Example_Torrent
   Saving to: /Users/yourname/Downloads/Torrents/Example_Torrent
   Selected total size: 50.00 MB
   Progress: 50.00% | Downloaded: 25.00 MB | Speed: 1.00 MB/s | Time left: 0.42 min | Peers: 10
   ...
   Download complete! Files saved to: /Users/yourname/Downloads/Torrents/Example_Torrent
   ```

## Configuration
- **Download Path**: Change `BASE_DOWNLOAD_PATH` in the script (default: `~/Downloads/Torrents`).
- **Max Connections**: Adjust `MAX_CONNECTIONS` (default: 200) for performance (higher may speed up but use more resources).
- **Upload Limit**: Uncomment `uploadLimit: UPLOAD_LIMIT` in `clientOpts` to set upload speed (helps with peer reciprocity).
- **Trackers**: The `PUBLIC_TRACKERS` array is pre-filled with reliable ones (updated October 2025). Add/remove as needed.
- **Suppress Warnings**: Uncomment the `torrent.on('warning', ...)` block to hide logs like piece failures or timeouts.

## How It Works
1. **Input Handling**: Uses `readline` to prompt for magnet link.
2. **Metadata Fetch**: Adds torrent temporarily to get file list.
3. **File Selection**: Parses user input (numbers, ranges, "all") and calculates exact piece ranges to download only selected files.
4. **Folder Creation**: Sanitizes torrent name and creates a subfolder.
5. **Downloading**: Re-adds torrent with path, selects pieces, and monitors progress via interval.
6. **Completion**: Custom check sums downloaded bytes for selected files; exits on finish or error.

The script is robust: It deselects all pieces first, then precisely selects needed ones to avoid extras. Retries failed pieces automatically (BitTorrent standard).

## Troubleshooting
- **Slow Speeds**: Ensure torrent has many seeders. Use VPN. Update trackers if timeouts occur.
- **Piece Verification Failures**: Normal for bad peers—script retries. If persistent, try different torrent.
- **No Peers**: Add more trackers or check internet/firewall.
- **Errors**:
  - "Invalid magnet": Ensure link starts with `magnet:`.
  - Module errors: Run `npm install` again; check Node version.
- **Progress >100% or Stalled**: Due to retries; wait or restart with better network.

For advanced tweaks: Integrate with Express for a web UI, or add bandwidth throttling.

## Contributing
Fork the repo, make changes, and submit a pull request. Issues welcome at [github.com/nadikaprabhath/torrent-downloader](https://github.com/nadikaprabhath) (replace with your actual repo).

## License
MIT License. Copyright (c) 2025 Nadika Prabhath. See script header for details.
