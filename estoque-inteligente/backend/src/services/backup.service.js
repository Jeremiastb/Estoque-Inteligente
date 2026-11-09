const fs = require('fs');
const path = require('path');
const { db } = require('../config/mongodb');
const { connect: connectMy } = require('../config/mysql');
const { connect: connectSs, sql } = require('../config/sqlserver');
const logger = require('../utils/logger');

const BACKUP_DIR = path.join(__dirname, '../../backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

module.exports = {
  /** Aula 14 - Backup lógico do MongoDB (dump JSON) */
  async backupMongo() {
    const collections = await db().listCollections().toArray();
    const dump = {};
    for (const c of collections) {
      dump[c.name] = await db().collection(c.name).find({}).toArray();
    }
    const file = path.join(BACKUP_DIR, `mongo_${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(dump, null, 2));
    logger.info(`Backup MongoDB gerado: ${file}`);
    return file;
  },

  /** Aula 14 - Restore lógico do MongoDB */
  async restoreMongo(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const col of Object.keys(data)) {
      await db().collection(col).deleteMany({});
      if (data[col].length) await db().collection(col).insertMany(data[col]);
    }
    logger.info(`Restore MongoDB concluído a partir de ${filePath}`);
    return true;
  },

  /** Aula 14 - Backup MySQL via mysqldump (executa no servidor) */
  async backupMySQL() {
    const { exec } = require('child_process');
    const file = path.join(BACKUP_DIR, `mysql_${Date.now()}.sql`);
    const cmd = `mysqldump -h ${process.env.MYSQL_HOST} -u ${process.env.MYSQL_USER} -p${process.env.MYSQL_PASSWORD} ${process.env.MYSQL_DATABASE} > ${file}`;
    return new Promise((resolve, reject) => {
      exec(cmd, err => err ? reject(err) : resolve(file));
    });
  },

  /** Aula 14 - Backup SQL Server (BACKUP DATABASE) */
  async backupSQLServer() {
    const pool = await connectSs();
    const file = `C:\\backups\\sqlserver_${Date.now()}.bak`; // ajustar path do servidor
    await pool.request()
      .input('file', sql.VarChar(500), file)
      .query(`BACKUP DATABASE ${process.env.SQLSERVER_DATABASE} TO DISK = @file WITH FORMAT`);
    return file;
  },

  /** Aula 14 - Snapshot de views */
  async snapshotViews() {
    const pool = await connectSs();
    const r = await pool.request().query(
      `SELECT name, definition FROM sys.sql_modules m
       JOIN sys.views v ON m.object_id = v.object_id`
    );
    const file = path.join(BACKUP_DIR, `views_${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(r.recordset, null, 2));
    return file;
  }
};