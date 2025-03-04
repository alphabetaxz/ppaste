const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

// Database path in the user's app data directory
const dbPath = path.join(app.getPath('userData'), 'clipboard_history.db');

// Create and initialize the database
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database opening error: ', err);
        reject(err);
        return;
      }
      
      // 启用WAL模式，提高写入性能和可靠性
      db.run('PRAGMA journal_mode = WAL;', (err) => {
        if (err) {
          console.error('Failed to enable WAL mode:', err);
          // 继续执行，不要因为这个失败就中断
        } else {
          console.log('WAL mode enabled for database');
        }
        
        // 设置同步模式为FULL，确保数据安全
        db.run('PRAGMA synchronous = FULL;', (err) => {
          if (err) {
            console.error('Failed to set synchronous mode:', err);
          } else {
            console.log('Full synchronous mode enabled');
          }
          
          // Create table if it doesn't exist
          db.run(`CREATE TABLE IF NOT EXISTS clipboard_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            content_type TEXT DEFAULT 'text',
            timestamp INTEGER NOT NULL
          )`, (err) => {
            if (err) {
              console.error('Table creation error: ', err);
              reject(err);
              return;
            }
            resolve(db);
          });
        });
      });
    });
  });
};

// Safely close the database
const closeDatabase = (db) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    
    // 先执行一次同步操作
    db.run('PRAGMA wal_checkpoint(FULL);', (err) => {
      if (err) {
        console.error('Error during WAL checkpoint:', err);
        // 继续关闭数据库，不要因为这个失败就中断
      } else {
        console.log('Database WAL checkpoint completed');
      }
      
      // 关闭数据库
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('Database closed successfully');
          resolve();
        }
      });
    });
  });
};

// 执行数据库同步，确保数据被写入磁盘
const syncDatabase = (db) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    
    // 首先执行一个简单的查询，确保所有挂起的写入操作都已完成
    db.run('PRAGMA busy_timeout = 5000;', (err) => {
      if (err) {
        console.error('Error setting busy timeout:', err);
        // 继续执行，不要因为这个失败就中断
      }
      
      // 执行WAL检查点，将WAL文件中的内容合并到主数据库文件
      db.run('PRAGMA wal_checkpoint(FULL);', (err) => {
        if (err) {
          console.error('Error during database sync (FULL checkpoint):', err);
          // 尝试使用PASSIVE检查点作为备选
          db.run('PRAGMA wal_checkpoint(PASSIVE);', (err2) => {
            if (err2) {
              console.error('Error during database sync (PASSIVE checkpoint):', err2);
              reject(err2);
            } else {
              console.log('Database synced to disk (PASSIVE checkpoint)');
              resolve();
            }
          });
        } else {
          console.log('Database synced to disk (FULL checkpoint)');
          resolve();
        }
      });
    });
  });
};

// Add a new clipboard item
const addClipboardItem = (db, content, contentType = 'text') => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database connection is not available'));
      return;
    }
    
    // 如果内容为null或undefined，使用空字符串代替
    if (content === null || content === undefined) {
      content = '';
      console.log('Null or undefined content converted to empty string');
    }
    
    const timestamp = Date.now();
    
    // 设置较长的超时时间，避免繁忙错误
    db.run('PRAGMA busy_timeout = 5000;', (err) => {
      if (err) {
        console.error('Error setting busy timeout:', err);
        // 继续执行，不要因为这个失败就中断
      }
      
      // 开始事务
      db.run('BEGIN IMMEDIATE TRANSACTION', (err) => {
        if (err) {
          console.error('Error beginning transaction:', err);
          reject(err);
          return;
        }
        
        // 检查此内容是否已存在（避免重复）
        db.get('SELECT id FROM clipboard_items WHERE content = ?', [content], (err, row) => {
          if (err) {
            // 回滚事务
            db.run('ROLLBACK', () => {
              reject(err);
            });
            return;
          }
          
          if (row) {
            // 更新现有项目的时间戳
            db.run('UPDATE clipboard_items SET timestamp = ? WHERE id = ?', 
              [timestamp, row.id], 
              function(err) {
                if (err) {
                  // 回滚事务
                  db.run('ROLLBACK', () => {
                    reject(err);
                  });
                  return;
                }
                
                // 提交事务
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('Error committing transaction:', err);
                    db.run('ROLLBACK', () => {
                      reject(err);
                    });
                    return;
                  }
                  
                  console.log(`Updated timestamp for existing item (ID: ${row.id})`);
                  resolve(row.id);
                  
                  // 异步执行同步操作
                  syncDatabase(db).catch(err => {
                    console.error('Error syncing database after update:', err);
                  });
                });
              }
            );
          } else {
            // 插入新项目
            db.run('INSERT INTO clipboard_items (content, content_type, timestamp) VALUES (?, ?, ?)',
              [content, contentType, timestamp],
              function(err) {
                if (err) {
                  // 回滚事务
                  db.run('ROLLBACK', () => {
                    reject(err);
                  });
                  return;
                }
                
                const newId = this.lastID;
                
                // 提交事务
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('Error committing transaction:', err);
                    db.run('ROLLBACK', () => {
                      reject(err);
                    });
                    return;
                  }
                  
                  console.log(`Inserted new clipboard item (ID: ${newId})`);
                  resolve(newId);
                  
                  // 异步执行同步操作
                  syncDatabase(db).catch(err => {
                    console.error('Error syncing database after insert:', err);
                  });
                });
              }
            );
          }
        });
      });
    });
  });
};

// Get recent clipboard items (limited to count)
const getRecentItems = (db, count = 50) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM clipboard_items ORDER BY timestamp DESC LIMIT ?',
      [count],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        console.log(`Retrieved ${rows.length} clipboard items`);
        resolve(rows);
      }
    );
  });
};

// Delete old items beyond a certain count
const cleanupOldItems = (db, keepCount = 200) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    
    // 获取当前项目数量
    db.get('SELECT COUNT(*) as count FROM clipboard_items', (err, row) => {
      if (err) {
        console.error('Error counting clipboard items:', err);
        reject(err);
        return;
      }
      
      const currentCount = row.count;
      
      // 如果项目数量超过保留数量，则删除最旧的项目
      if (currentCount > keepCount) {
        const deleteCount = currentCount - keepCount;
        console.log(`Cleaning up ${deleteCount} old clipboard items...`);
        
        // 开始事务
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            console.error('Error beginning cleanup transaction:', err);
            reject(err);
            return;
          }
          
          // 删除最旧的项目
          db.run(`DELETE FROM clipboard_items WHERE id IN (
            SELECT id FROM clipboard_items ORDER BY timestamp ASC LIMIT ?
          )`, [deleteCount], function(err) {
            if (err) {
              // 回滚事务
              db.run('ROLLBACK', () => {
                console.error('Error deleting old items, transaction rolled back:', err);
                reject(err);
              });
              return;
            }
            
            // 提交事务
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Error committing cleanup transaction:', err);
                db.run('ROLLBACK', () => {
                  reject(err);
                });
                return;
              }
              
              console.log(`Successfully deleted ${this.changes} old clipboard items`);
              
              // 清理后执行同步，确保更改被写入磁盘
              syncDatabase(db).catch(err => {
                console.error('Error syncing database after cleanup:', err);
              });
              
              resolve();
            });
          });
        });
      } else {
        console.log(`No cleanup needed, current count (${currentCount}) <= keep count (${keepCount})`);
        resolve();
      }
    });
  });
};

// 设置数据库维护任务
const setupDatabaseMaintenance = (db) => {
  console.log('Setting up database maintenance tasks...');
  
  // 每小时清理一次旧项目
  const cleanupInterval = setInterval(() => {
    console.log('Running scheduled cleanup of old clipboard items...');
    cleanupOldItems(db)
      .then(() => console.log('Scheduled cleanup completed'))
      .catch(err => console.error('Scheduled cleanup failed:', err));
  }, 60 * 60 * 1000); // 每小时
  
  // 每10分钟同步一次数据库
  const syncInterval = setInterval(() => {
    console.log('Running scheduled database sync...');
    syncDatabase(db)
      .then(() => console.log('Scheduled database sync completed'))
      .catch(err => console.error('Scheduled database sync failed:', err));
  }, 10 * 60 * 1000); // 每10分钟
  
  // 返回清理函数
  return () => {
    console.log('Clearing database maintenance intervals...');
    clearInterval(cleanupInterval);
    clearInterval(syncInterval);
  };
};

module.exports = {
  initDatabase,
  addClipboardItem,
  getRecentItems,
  cleanupOldItems,
  closeDatabase,
  syncDatabase,
  setupDatabaseMaintenance
}; 