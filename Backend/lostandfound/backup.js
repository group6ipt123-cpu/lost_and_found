require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const backupDir = path.join(__dirname, 'backups');
const dbName = 'lostandfound';
const maxBackups = 7; 

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `backup-${timestamp}`);

console.log(`Starting backup: ${timestamp}`);
console.log(`Output: ${backupPath}`);

const command = `mongodump --db=${dbName} --out="${backupPath}"`;

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error('Backup failed:', error.message);
        process.exit(1);
    }
    
    console.log('Backup completed successfully!');
    console.log(stdout);
    
    // Clean up old backups
    const backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('backup-'))
        .sort()
        .reverse();
    
    if (backups.length > maxBackups) {
        const toDelete = backups.slice(maxBackups);
        toDelete.forEach(folder => {
            const folderPath = path.join(backupDir, folder);
            fs.rmSync(folderPath, { recursive: true, force: true });
            console.log(`Deleted old backup: ${folder}`);
        });
    }
    
    console.log(`Total backups: ${Math.min(backups.length, maxBackups)}`);
    process.exit(0);
});