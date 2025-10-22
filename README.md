# Torrent Downloader Script

This is a Node.js script for downloading torrents from magnet links. It supports selective file downloading, creates dedicated folders for each torrent, adds public trackers for better speed, and provides real-time progress updates with an animated progress bar. Built with WebTorrent, it's lightweight and runs in the console.

**Alternative**: For a more mature solution with higher speeds, see the [aria2 Setup Guide](#alternative-using-aria2) below.

## Features
- Paste a magnet link to start downloading.
- Fetches torrent metadata and lists files for selective download (e.g., choose specific files or "all").
- **Animated progress bar** with real-time visual feedback.
- **Intelligent ETA prediction** algorithm that adapts to varying download speeds.
- Automatically creates a new folder in `~/Downloads/Torrents` based on the torrent name.
- Adds reliable public trackers to improve peer discovery and download speeds.
- Precise piece selection to minimize downloading unwanted files.
- Comprehensive progress tracking: Shows percentage, downloaded size, speed, time left, and active peers.
- Error handling for invalid links, no peers, and interruptions (e.g., Ctrl+C for graceful shutdown).
- Custom completion check for selective downloads (since WebTorrent's 'done' event may not trigger perfectly).

## Prerequisites
- Node.js (version 14+ recommended; tested on v22+).
- A stable internet connection (torrents rely on peers/seeders).
- Optional: VPN to bypass ISP throttling for faster speeds.

## Installation
1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org/) if not already installed. Verify with `node -v`.

2. **Create a Project Directory**:
```bash
   mkdir torrent-downloader
   cd torrent-downloader
```

3. **Initialize the Project**:
```bash
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
```bash
   npm install webtorrent
```
   No other dependencies are needed (built-in Node modules like `readline`, `path`, `os`, and `fs` are used).

5. **Save the Script**:
   Copy the provided script into a file named `torrent-downloader.js` in your project directory.

## Usage
1. **Run the Script**:
```bash
   node torrent-downloader.js
```

2. **Paste Magnet Link**:
   - When prompted: "Paste your magnet link here:", paste a valid magnet URI (starts with `magnet:`) and press Enter.
   - The script fetches metadata, lists files, and asks for selection (e.g., "1,3-5" for files 1,3,4,5; or "all").

3. **Download Process**:
   - It creates a folder like `~/Downloads/Torrents/Torrent_Name`.
   - Shows an animated progress bar with real-time updates every 5 seconds.
   - The ETA prediction algorithm continuously adjusts based on actual download speeds.
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
   
   [████████████████░░░░░░░░░░░░░░░░] 50.00%
   Downloaded: 25.00 MB / 50.00 MB | Speed: 1.00 MB/s | ETA: 0.42 min | Peers: 10
   
   ...
   
   [████████████████████████████████] 100.00%
   Download complete! Files saved to: /Users/yourname/Downloads/Torrents/Example_Torrent
```

## Progress Tracking Features

### Animated Progress Bar
The script displays a smooth, animated progress bar that updates in real-time, providing visual feedback on download progress. The bar uses Unicode block characters for a clean, terminal-friendly appearance.

### ETA Prediction Algorithm
The intelligent ETA (Estimated Time of Arrival) prediction algorithm:
- Tracks download speed over multiple intervals for accuracy
- Adapts to fluctuating network conditions and peer availability
- Provides realistic time estimates that adjust as download progresses
- Smooths out temporary speed variations to avoid erratic predictions
- Displays time remaining in minutes or hours based on the estimated duration

## Configuration
- **Download Path**: Change `BASE_DOWNLOAD_PATH` in the script (default: `~/Downloads/Torrents`).
- **Max Connections**: Adjust `MAX_CONNECTIONS` (default: 200) for performance (higher may speed up but use more resources).
- **Progress Update Interval**: Modify the interval (default: 5 seconds) in the progress tracking section for more/less frequent updates.
- **Upload Limit**: Uncomment `uploadLimit: UPLOAD_LIMIT` in `clientOpts` to set upload speed (helps with peer reciprocity).
- **Trackers**: The `PUBLIC_TRACKERS` array is pre-filled with reliable ones (updated October 2025). Add/remove as needed.
- **Suppress Warnings**: Uncomment the `torrent.on('warning', ...)` block to hide logs like piece failures or timeouts.

## How It Works
1. **Input Handling**: Uses `readline` to prompt for magnet link.
2. **Metadata Fetch**: Adds torrent temporarily to get file list.
3. **File Selection**: Parses user input (numbers, ranges, "all") and calculates exact piece ranges to download only selected files.
4. **Folder Creation**: Sanitizes torrent name and creates a subfolder.
5. **Downloading**: Re-adds torrent with path, selects pieces, and monitors progress via interval.
6. **Progress Visualization**: Renders animated progress bar and calculates ETA based on rolling average of download speeds.
7. **Completion**: Custom check sums downloaded bytes for selected files; exits on finish or error.

The script is robust: It deselects all pieces first, then precisely selects needed ones to avoid extras. Retries failed pieces automatically (BitTorrent standard).

## Troubleshooting
- **Slow Speeds**: Ensure torrent has many seeders. Use VPN. Update trackers if timeouts occur.
- **Piece Verification Failures**: Normal for bad peers—script retries. If persistent, try different torrent.
- **No Peers**: Add more trackers or check internet/firewall.
- **Progress Bar Display Issues**: Ensure your terminal supports Unicode characters. Most modern terminals do.
- **Errors**:
  - "Invalid magnet": Ensure link starts with `magnet:`.
  - Module errors: Run `npm install` again; check Node version.
- **Progress >100% or Stalled**: Due to retries; wait or restart with better network.
- **ETA Jumps Around**: Normal during the first few seconds as the algorithm calibrates. It stabilizes after a few progress updates.

For advanced tweaks: Integrate with Express for a web UI, or add bandwidth throttling.

---

## Alternative: Using aria2

For faster downloads and more mature torrent support, you can use **aria2** instead. aria2 is a lightweight, multi-protocol command-line download utility that excels at torrents.

### Why aria2?
- **Faster speeds**: Better peer management and multi-connection support
- **More stable**: Production-ready with years of development
- **Versatile**: Supports HTTP/HTTPS, FTP, BitTorrent, and Metalink
- **Lightweight**: Minimal resource usage

### aria2 Setup (Windows)

1. **Download aria2**:
   - Get `aria2-1.37.0-win-64bit-build1.zip` from [GitHub Releases](https://github.com/aria2/aria2/releases)
   - Extract to a permanent location (e.g., `C:\Program Files\aria2`)

2. **Add to PATH** (optional but recommended):
   - Right-click "This PC" → Properties → Advanced system settings → Environment Variables
   - Under System variables, find `Path` → Edit → New
   - Add the aria2 folder path (e.g., `C:\Program Files\aria2`)
   - Click OK and restart Command Prompt

3. **Verify Installation**:
```bash
   aria2c --version
```

### Basic Usage

**Download a torrent**:
```bash
aria2c "magnet:?xt=urn:btih:YOUR_HASH_HERE"
```

**Download with optimized settings**:
```bash
aria2c --max-connection-per-server=16 --split=16 --min-split-size=1M --seed-time=0 "magnet:?xt=urn:btih:..."
```

**Download to specific folder**:
```bash
aria2c -d "C:\Downloads\Torrents" "magnet:?xt=urn:btih:..."
```

**Selective file download** (after fetching metadata):
```bash
# First, get the torrent file or use --show-files
aria2c --show-files "magnet:?xt=urn:btih:..."

# Then download specific file indices (e.g., files 1 and 3)
aria2c --select-file=1,3 "magnet:?xt=urn:btih:..."
```

### Recommended Configuration File

Create `aria2.conf` in the aria2 folder with these settings:
```conf
# Download directory
dir=C:\Downloads\Torrents

# Connection settings
max-connection-per-server=16
split=16
min-split-size=1M
max-concurrent-downloads=5

# BitTorrent settings
enable-dht=true
bt-enable-lpd=true
bt-max-peers=100
seed-time=0
bt-seed-unverified=true

# Add public trackers (update regularly)
bt-tracker=udp://tracker.opentrackr.org:1337/announce,udp://open.stealth.si:80/announce,udp://tracker.torrent.eu.org:451/announce,udp://tracker.moeking.me:6969/announce

# Progress display
console-log-level=notice
summary-interval=60
```

**Run with config**:
```bash
aria2c --conf-path="C:\Program Files\aria2\aria2.conf" "magnet:?xt=urn:btih:..."
```

### Troubleshooting aria2

**Won't run / "Not recognized" error**:
- Make sure aria2c.exe is in PATH or use full path: `"C:\Program Files\aria2\aria2c.exe"`
- Right-click aria2c.exe → Properties → Unblock (if downloaded from web)

**Won't download / stuck at 0%**:
- Check firewall isn't blocking aria2
- Ensure torrent has seeders
- Add more trackers with `--bt-tracker=...`

**Slow speeds**:
- Increase connections: `--max-connection-per-server=32 --split=32`
- Use VPN if ISP throttles torrents
- Update trackers list

**Missing Visual C++ error**:
- Install [Visual C++ Redistributables](https://aka.ms/vs/17/release/vc_redist.x64.exe)

### aria2 vs WebTorrent Script

| Feature | WebTorrent Script | aria2 |
|---------|------------------|-------|
| Setup | npm install | Binary download |
| Speed | Moderate | Faster |
| UI | Animated progress bar | Command-line |
| ETA | Smart prediction | Basic display |
| File selection | Interactive | CLI flags |
| Maturity | Good | Excellent |
| Use case | Node.js projects | Standalone use |

**Choose WebTorrent** if you want easy integration with Node.js projects, prefer interactive file selection, or enjoy the animated progress bar with intelligent ETA predictions.

**Choose aria2** if you need maximum speed, stability, or already use command-line tools.

---

## Contributing
Fork the repo, make changes, and submit a pull request. Issues welcome at [github.com/nadikaprabhath/magnet-torrent-downloader](https://github.com/nadikaprabhath/magnet-torrent-downloader).

## License
MIT License. Copyright (c) 2025 Nadika Prabhath. See script header for details.