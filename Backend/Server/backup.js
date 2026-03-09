// Backend/Server/backup.js
/**
 * Automated Backup Service
 * Daily backups of database to JSON files
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
}

async function performBackup() {
    try {
        console.log('📦 Starting database backup...');
        
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `backup-${timestamp}.json`;
        const filepath = path.join(BACKUP_DIR, filename);
        
        // Check if backup already exists today
        if (fs.existsSync(filepath)) {
            console.log(`⚠️  Backup already exists for today: ${filename}`);
            return;
        }
        
        // Fetch all data (in production, do this in batches if large)
        const { data, error, count } = await supabase
            .from('retain_auth_memory')
            .select('*', { count: 'exact' });
        
        if (error) {
            throw new Error(`Database query failed: ${error.message}`);
        }
        
        // Write backup
        fs.writeFileSync(filepath, JSON.stringify({
            backupDate: new Date().toISOString(),
            recordCount: count,
            data: data
        }, null, 2));
        
        console.log(`✅ Backup completed successfully`);
        console.log(`   Records: ${count}`);
        console.log(`   File: ${filename}`);
        console.log(`   Size: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`);
        
        // Cleanup old backups (keep last 30 days)
        cleanupOldBackups(30);
        
    } catch (error) {
        console.error('❌ Backup failed:', error.message);
        // In production, send alert here (e.g., email, Slack, etc.)
    }
}

function cleanupOldBackups(daysToKeep) {
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        const now = Date.now();
        const maxAge = daysToKeep * 24 * 60 * 60 * 1000; // Convert days to ms
        
        let deletedCount = 0;
        
        files.forEach(file => {
            if (!file.startsWith('backup-')) return;
            
            const filepath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filepath);
            const age = now - stats.mtimeMs;
            
            if (age > maxAge) {
                fs.unlinkSync(filepath);
                deletedCount++;
                console.log(`🗑️  Deleted old backup: ${file}`);
            }
        });
        
        if (deletedCount > 0) {
            console.log(`✅ Cleaned up ${deletedCount} old backup(s)`);
        }
    } catch (error) {
        console.error('⚠️  Cleanup failed:', error.message);
    }
}

// Run backup immediately
performBackup();

// Schedule daily backups at 2 AM (run once per day)
// Note: In production, use a proper cron job or task scheduler
console.log('⏰ Backup service initialized. Run this script daily via cron.');

// Example cron job (add to crontab):
// 0 2 * * * cd /path/to/Backend/Server && node backup.js

export { performBackup, cleanupOldBackups };
