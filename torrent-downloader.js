/*
 * Copyright (c) 2025 Nadika Prabhath
 * GitHub: https://github.com/nadikaprabhath
 * All rights reserved.
 */

import WebTorrent from 'webtorrent';
import * as readline from 'readline';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';

// Configuration
const BASE_DOWNLOAD_PATH = path.join(os.homedir(), 'Downloads/Torrents');
const MAX_CONNECTIONS = 200; // Increased for better peer connections and faster speeds
const UPLOAD_LIMIT = 100 * 1024; // Optional: 100 KB/s upload limit (uncomment in clientOpts if needed)
// Curated list of reliable public UDP trackers (updated October 2025 from ngosang/trackerslist and newtrackon)
const PUBLIC_TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.tracker.cl:1337/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://tracker.tiny-vps.com:6969/announce',
  'udp://open.stealth.si:80/announce',
  'udp://exodus.desync.com:6969/announce',
  'udp://tracker.cyberia.is:6969/announce',
  'udp://www.torrent.eu.org:451/announce',
  'udp://tracker1.bt.moack.co.kr:80/announce',
  'udp://tracker.openbittorrent.com:6969/announce',
  'udp://bt.xxx-tracker.com:2710/announce',
  'udp://explodie.org:6969/announce',
  'udp://p4p.arenabg.com:1337/announce',
  'udp://opentracker.i2p.rocks:6969/announce',
  'udp://tracker.internetwarriors.net:1337/announce',
  'udp://tracker.openbittorrent.com:80/announce',
  'udp://ipv4.tracker.harry.lu:80/announce',
  'udp://open.demonii.si:1337/announce'
];

// Ensure base download path exists
const ensureBasePath = async () => {
  try {
    await fs.mkdir(BASE_DOWNLOAD_PATH, { recursive: true });
    console.log(`Created/using base download folder: ${BASE_DOWNLOAD_PATH}`);
  } catch (err) {
    console.error(`Error creating base folder: ${err.message}`);
    process.exit(1);
  }
};

await ensureBasePath();

const clientOpts = {
  maxConns: MAX_CONNECTIONS,
  // uploadLimit: UPLOAD_LIMIT // Uncomment to enable upload limit
};

const client = new WebTorrent(clientOpts);

// Setup console input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to prompt user
const promptUser = (question) => new Promise((resolve) => {
  rl.question(question, resolve);
});

// Function to handle the download (async)
async function downloadTorrent(originalMagnetURI) {
  let magnetURI = originalMagnetURI;
  if (!magnetURI.startsWith('magnet:')) {
    throw new Error('Invalid magnet link. It must start with "magnet:".');
  }

  console.log('Fetching metadata...');

  // Add public trackers to the magnet URI for better peer discovery
  const trackerParams = PUBLIC_TRACKERS.map(tr => `&tr=${encodeURIComponent(tr)}`).join('');
  magnetURI += trackerParams;
  console.log('Added public trackers to magnet URI.');

  // First add to get metadata
  const tempTorrent = client.add(magnetURI);

  try {
    // Wait for metadata
    await new Promise((resolve, reject) => {
      tempTorrent.on('metadata', resolve);
      tempTorrent.on('error', reject);
    });

    console.log(`\nTorrent metadata loaded.`);
    console.log(`Name: ${tempTorrent.name}`);
    console.log(`Files: ${tempTorrent.files.length}`);
    console.log(`Total size: ${(tempTorrent.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Piece length: ${(tempTorrent.pieceLength / 1024).toFixed(2)} KB`);

    // List files for selection
    console.log('\nFiles:');
    tempTorrent.files.forEach((file, index) => {
      console.log(`${index + 1}: ${file.name} (${(file.length / 1024 / 1024).toFixed(2)} MB)`);
    });

    // Prompt for file selection
    const selectionInput = await promptUser('\nEnter file numbers to download (comma-separated, e.g., 1,3-5, or "all"): ');
    const selectedIndices = parseSelection(selectionInput, tempTorrent.files.length);

    console.log(`Selected files: ${selectedIndices.map(i => i + 1).join(', ')}`);

    // Destroy temp torrent
    tempTorrent.destroy();

    // Create new folder
    const torrentFolderName = tempTorrent.name.replace(/[^a-zA-Z0-9]/g, '_');
    const downloadPath = path.join(BASE_DOWNLOAD_PATH, torrentFolderName);

    try {
      await fs.mkdir(downloadPath, { recursive: true });
      console.log(`Created new download folder: ${downloadPath}`);
    } catch (err) {
      console.error(`Error creating download folder: ${err.message}`);
      process.exit(1);
    }

    console.log(`Saving to: ${downloadPath}`);

    // Add torrent again with path and advanced options (e.g., sequential for better selective)
    const torrent = client.add(magnetURI, { path: downloadPath, sequential: true });

    // Wait for metadata again
    await new Promise((resolve, reject) => {
      torrent.on('metadata', () => {
        // Deselect all pieces first to prevent any unwanted downloads
        torrent.deselect(0, torrent.pieces.length - 1, false);
        resolve();
      });
      torrent.on('error', reject);
    });

    // Calculate piece ranges for selected files to precisely select only necessary pieces
    const pieceLength = torrent.pieceLength;
    const selectedPieceRanges = [];
    selectedIndices.forEach((index) => {
      const file = torrent.files[index];
      const startPiece = Math.floor(file.offset / pieceLength);
      const endPiece = Math.ceil((file.offset + file.length) / pieceLength) - 1;
      selectedPieceRanges.push({ start: startPiece, end: endPiece });
      console.log(`Selected file: ${file.name} (pieces ${startPiece}-${endPiece})`);
    });

    // Merge overlapping ranges to optimize
    const mergedRanges = mergeRanges(selectedPieceRanges);

    // Select only the merged piece ranges
    mergedRanges.forEach(({ start, end }) => {
      torrent.select(start, end, false); // false for normal priority
    });

    // Deselect individual files not selected (redundant but ensures)
    torrent.files.forEach((file, index) => {
      if (!selectedIndices.includes(index)) {
        file.deselect();
        console.log(`Deselected file: ${file.name}`);
      }
    });

    // Calculate selected total length for progress
    const selectedLength = selectedIndices.reduce((acc, index) => acc + torrent.files[index].length, 0);
    console.log(`Selected total size: ${(selectedLength / 1024 / 1024).toFixed(2)} MB`);

    // Progress interval with accurate selected downloaded calculation
    const progressInterval = setInterval(() => {
      const selectedDownloaded = selectedIndices.reduce((acc, index) => acc + torrent.files[index].downloaded, 0);
      const progress = Math.min((selectedDownloaded / selectedLength) * 100, 100);
      const downloaded = (selectedDownloaded / 1024 / 1024).toFixed(2);
      const speed = (torrent.downloadSpeed / 1024 / 1024).toFixed(2);
      const remainingBytes = selectedLength - selectedDownloaded;
      const timeLeft = remainingBytes > 0 && torrent.downloadSpeed > 0 ? (remainingBytes / torrent.downloadSpeed / 60).toFixed(2) : 'Unknown';
      const peers = torrent.numPeers;

      console.log(`Progress: ${progress.toFixed(2)}% | Downloaded: ${downloaded} MB | Speed: ${speed} MB/s | Time left: ${timeLeft} min | Peers: ${peers}`);

      // Custom completion check
      if (selectedDownloaded >= selectedLength) {
        clearInterval(progressInterval);
        console.log(`\nDownload complete! Files saved to: ${downloadPath}`);
        client.destroy();
        process.exit(0);
      }
    }, 5000);

    // Error handling
    torrent.on('error', (err) => {
      clearInterval(progressInterval);
      console.error(`\nTorrent error: ${err.message}`);
      client.destroy();
      process.exit(1);
    });

    // Warning (comment out to suppress all warnings)
    // torrent.on('warning', (warn) => {
    //   console.warn(`Warning: ${warn.message}`);
    // });

  } catch (err) {
    console.error(`\nError: ${err.message}`);
    client.destroy();
    process.exit(1);
  }
}

// Helper to merge overlapping piece ranges
function mergeRanges(ranges) {
  if (ranges.length === 0) return [];
  ranges.sort((a, b) => a.start - b.start);
  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const current = merged[merged.length - 1];
    const next = ranges[i];
    if (current.end >= next.start - 1) {
      current.end = Math.max(current.end, next.end);
    } else {
      merged.push(next);
    }
  }
  return merged;
}

// Parse selection
function parseSelection(input, totalFiles) {
  if (input.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalFiles }, (_, i) => i);
  }

  const selected = new Set();
  const parts = input.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end) && start <= end && start >= 1 && end <= totalFiles) {
        for (let i = start; i <= end; i++) {
          selected.add(i - 1);
        }
      }
    } else {
      const num = Number(trimmed);
      if (!isNaN(num) && num >= 1 && num <= totalFiles) {
        selected.add(num - 1);
      }
    }
  }

  if (selected.size === 0) {
    throw new Error('No valid files selected.');
  }

  return Array.from(selected);
}

// Global client error
client.on('error', (err) => {
  console.error(`Client error: ${err.message}`);
  process.exit(1);
});

// Prompt for magnet link
const magnetURI = (await promptUser('Paste your magnet link here: ')).trim();

if (magnetURI) {
  try {
    await downloadTorrent(magnetURI);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
} else {
  console.log('No link provided. Exiting.');
  process.exit(0);
}

rl.close();

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  client.destroy();
  process.exit(0);
});