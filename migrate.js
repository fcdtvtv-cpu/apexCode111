'use strict';
const fs = require('node:fs');
const envPath = require('node:path').join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) { const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/); if(m && process.env[m[1]]===undefined) process.env[m[1]]=m[2].replace(/^(['\"])(.*)\1$/,'$2'); }
const path = require('node:path');
const { Pool } = require('pg');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL не задан в .env');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined });
(async()=>{try{const sql=fs.readFileSync(path.join(__dirname,'..','migrations','001_initial.sql'),'utf8');await pool.query(sql);console.log('Миграции БД применены.');}finally{await pool.end();}})().catch(e=>{console.error(e);process.exit(1);});
