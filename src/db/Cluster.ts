import * as fs from 'node:fs'
import * as path from 'node:path'

import * as paths from './StorageLocations';

import { $Types, $Perms, type IUser, IDBFile } from "./Types";
import { Database, LimitedDatabase } from "./Database";
import { User } from "./User";
import { Table } from "./Table";
import { Schema } from "./Schema";
import { Generators } from './Generators';

export class Cluster {
    private _root: string;
    private _users: User
    private _databases: Database[] = [];
    private _limitedDatabases: LimitedDatabase[] = []
    public _generators = new Map<string, (...args: any[])=>any>()

    get root() {
        return String(this._root);
    }

    constructor(root: string) {
        this._root = root;
        this._users = new User(this)
        this.registerBuiltinGenerators()
        if (!fs.existsSync(path.join(root, 'users')))
            fs.mkdirSync(
                path.join(root, 'users'),
                {recursive:true}
            );
        if (!fs.existsSync(path.join(root, 'databases')))
            fs.mkdirSync(
                path.join(root, 'databases'),
                {recursive:true}
            );
    }

    public masterLoad() {
        const dbRoot = path.join(this._root, 'databases')
        this._users.loadRecords();

        if (fs.existsSync(dbRoot)) {
            const folder = fs.readdirSync(dbRoot)
            for (const _db of folder) {
                const file = fs.readFileSync(path.join(dbRoot,_db,'db.json'), 'utf-8')
                const dbObj: IDBFile = JSON.parse(file)
                const db = new Database(this, dbObj.name, this.getUser(dbObj.owner), <any>(dbObj.granted))
                db.loadDb()
                this._databases.push(db)
            }
        }

    }

    public registerBuiltinGenerators() {
        this._generators.set('builtin_id_base', Generators.id_base)
        this._generators.set('builtin_id_gen' , Generators.id_gen)
    }

    public createUser(name: string, password: string, role: 'admin' | 'user') {
        return this._users.create(name, password, role);
    }

    public getUser(name: string) {
        return this._users.get(name);
    }

    public createDatabase(name: string, owner: IUser) {
        this._databases.push(new Database(this, name, owner));
        if (!fs.existsSync(path.join(this._root, 'databases', name, 'tables')))
            fs.mkdirSync(
                path.join(this._root, 'databases', name, 'tables'),
                {recursive:true}
            );
    }

    public getDatabase(name: string) {
        return this._databases.find(db => db.name === name);
    }

    private getLimitedDatabase(name: string) {
        return this._limitedDatabases.find(db => db.name === name);
    }

    public db(as: IUser, db: string) {
        const _db = this.getDatabase(db)
        if (!_db) throw new Error(`Database '${db}' not found.`);
        if (_db.owner === as || as.dbRole === 'admin') return _db
        else {
            const usr = (function(){
                for (const usr of _db.granted) {
                    if (usr.usr === as.dbUser) return usr
                }
            })()

            if (!usr) throw new Error(`User '${usr.usr}' has no access to Database '${db}'.`)
            
            // let __db
            const __db = new LimitedDatabase(
                usr.perms,
                this,
                _db.name,
                _db.owner,
                _db.granted
            )
            __db.loadDb(true)
            // this._limitedDatabases.push(__db)
            return __db
        }
    }

    public masterWrite() {
        for (const db of this._databases) {
            db.masterWrite()
        }
        for (const db of this._limitedDatabases) {
            db.masterWrite()
        }

        this._users.write()
    }
}