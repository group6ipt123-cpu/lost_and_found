const { exec } = require('child_process');
const path = require('path');

const backupDir = path.join(__dirname, 'backups');
const date = new Date().toISOString().replace(/[:.]/g, '-');
const command = `mongodump --db=lostandfound --out="${backupDir}/${date}"`;

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error('Backup failed:', error);
        return;
    }
    console.log('Backup completed:', `${backupDir}/${date}`);
});