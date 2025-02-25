import * as fs from 'fs';
import * as path from 'path';


// basically just make little functions that gives us the right path
export const getTableFilePath = (root: string, dbName: string, tableName: string, file: 'records.json'|'schema.json') => path.join(root, 'databases', dbName, 'tables', tableName, file);
export const getUsersFilePath = (root: string) => path.join(root, 'users', 'records.json');
export const getDbFilePath = (root: string, dbName: string) => path.join(root, 'databases', dbName, 'db.json');



export const getTablePath = (root: string, dbName: string, tableName: string) => path.join(root, 'databases', dbName, 'tables', tableName);
export const getDbPath = (root: string, dbName: string) => path.join(root, 'databases', dbName);
export const getUsersPath = (root: string) => path.join(root, 'users');
// now make a function that creates the file structure if it doesn't exist
// export const createFileStructure = (root: string) => {
//     if (!fs.existsSync(getClusterPath
//         (root))) {
//         fs.mkdirSync(getClusterPath(root));
//     }
//     if (!fs.existsSync(getUsersPath(root))) {
//         fs.mkdirSync(getUsersPath(root));
//     }
//     if (!fs.existsSync(getDatabasesPath(root))) {
//         fs.mkdirSync(getDatabasesPath(root));
//     }
// }

