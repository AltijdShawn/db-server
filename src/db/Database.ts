import * as fs from 'fs';
import * as path from 'path';
import * as paths from './StorageLocations';
import { $Perms, $Types, type IUser } from './Types';
import { Table, LimitedTable } from './Table';
import { User } from './User';
import { Schema } from './Schema';

export {IDBFile} from './Types' 

export class Database {
    private _cluster: any;
    private _owner: IUser;
    private _name: string;

    private _grantedAccess: {
        usr: string, 
        perms: (keyof typeof $Perms)[]
    }[] = [];

    private _tables: Table[] = [];

    get name() {
        return this._name;
    }

    get owner() {
        return this._owner;
    }

    get granted() {
        return [...this._grantedAccess]
    }

    get tables() {
        return [...this._tables];
    }

    constructor(
        cluster: any,
        name: string,
        owner: IUser,
        granted:{
            usr: string, 
            perms: (keyof typeof $Perms)[]
        }[] = []) {
        this._cluster = cluster;
        this._name = name;
        this._owner = owner;
        this._grantedAccess = granted
    }

    public createTable(name: string, schema: Schema|{[field:string]: number}) {
        if (!fs.existsSync(path.join(this._cluster.root, 'databases', this._name, 'tables', name)))
            fs.mkdirSync(
                path.join(this._cluster.root, 'databases', this._name, 'tables', name),
                {recursive:true}
            );
        this._tables.push(new Table(this._cluster, this._name, name, schema));
        return this._tables.find(table => table.name === name);
    }

    public getTable(name: string): Table {
        return this._tables.find(table => table.name === name);
    }

    public grantAccess(user: IUser, perms: (keyof typeof $Perms)[]) {
        const existing = this._grantedAccess.find(u => u.usr === user.dbUser)
        if (existing) {
            this._grantedAccess = this._grantedAccess.filter(u => u.usr !== user.dbUser)
            let object = existing;
            object.perms = [...(object.perms), ...perms]
            this._grantedAccess.push(object)
        }
        else this._grantedAccess.push({usr: user.dbUser, perms});
    }

    public revokeAccess(user: IUser, perms?:number[]) {
        // console.log({user,perms},this._grantedAccess)
        const existing = this._grantedAccess.find(u => u.usr === user.dbUser)
        // console.log(existing)
        if (perms) {
            this._grantedAccess = this._grantedAccess.filter(u => u.usr !== user.dbUser)
            let object = existing;
            // console.log(object)
            for (const p of perms) {
                object.perms = object.perms.filter(_p => <any>_p !== p)
            }

            this._grantedAccess.push(object)
        }
        else this._grantedAccess = this._grantedAccess.filter(access => access.usr !== user.dbUser);
    }

    public hasAccess(user: IUser, perm: keyof typeof $Perms) {
        return this._grantedAccess.some(access => access.usr === user.dbUser && access.perms.includes(perm));
    }

    public writeDb() {
        const tables = this._tables.map(table => {
            return {
                name: table.name
            };
        }) || []
        const granted = this._grantedAccess.map(access => {
            return {
                usr: access.usr,
                perms: access.perms
            };
        }) || []
        // console.log(this)
        const db = {
            owner: this._owner.dbUser,
            name: this._name,
            tables,
            granted
        };
        return fs.writeFileSync(paths.getDbFilePath(this._cluster.root, this._name), JSON.stringify(db), 'utf-8');
    }

    public masterWrite() {
        for (const t of this._tables) {
            t.write()
        }
        this.writeDb()
    }

    public loadDb() {
        // console.log(`loadDb Called`)
        const file = fs.readFileSync(paths.getDbFilePath(this._cluster.root, this._name), 'utf-8');
        const db = JSON.parse(file);

        this._name = db.name;
        // this._owner = db.owner;
        this._grantedAccess = db.granted

        // console.log(this._owner)

        for (const table of db.tables) {
            const schema = new Schema()
                .fromJson(
                    JSON.parse(
                        fs.readFileSync(
                            paths.getTableFilePath(
                                this._cluster.root,
                                this._name,
                                table.name,
                                'schema.json'
                            )
                        , 'utf-8')
                    )
                );
            const tab = new Table(this._cluster, this._name, table.name, schema)
            tab.loadRecords()
            this._tables.push(tab)
            console.log(`loaded DB '${this._name}'`)
        }
    }
}

export class LimitedDatabase {
    private _cluster: any;
    private _owner: IUser;
    private _name: string;

    private _grantedAccess: {
        usr: string, 
        perms: (keyof typeof $Perms)[]
    }[] = [];

    private _tables: LimitedTable[] = [];

    get name() {
        return this._name;
    }

    get owner() {
        return this._owner;
    }

    get granted() {
        return [...this._grantedAccess]
    }

    get tables() {
        return [...this._tables];
    }

    constructor(
        protected perms: (keyof typeof $Perms)[],
        cluster: any,
        name: string,
        owner: IUser,
        granted?:{
            usr: string, 
            perms: (keyof typeof $Perms)[]
        }[]) {
        this._cluster = cluster;
        this._name = name;
        this._owner = owner;
        this._grantedAccess = granted
    }

    public createTable(name: string, schema: Schema|{[field:string]: number}) {
        if (
            this.perms.includes(<any>$Perms.Admin) ||
            this.perms.includes(<any>$Perms.CreateTable)
        ) {
            if (!fs.existsSync(path.join(this._cluster.root, 'databases', this._name, 'tables', name)))
                fs.mkdirSync(
                    path.join(this._cluster.root, 'databases', this._name, 'tables', name),
                    {recursive:true}
                );
            return this._tables.push(new LimitedTable(this.perms,this._cluster, this._name, name, schema));
        } else throw new Error(`Invalid permissions for user on db '${this._name}'`)
    }

    public getTable(name: string): LimitedTable {
        return this._tables.find(table => table.name === name);
    }

    public grantAccess(user: IUser, perms: (keyof typeof $Perms)[]) {
        if (!this.perms.includes(<any>$Perms.Admin)) 
            throw new Error(`Invalid permissions for user on db '${this._name}'`);
        this._grantedAccess.push({usr: user.dbUser, perms});
    }

    public revokeAccess(user: IUser) {
        if (!this.perms.includes(<any>$Perms.Admin)) 
            throw new Error(`Invalid permissions for user on db '${this._name}'`);
        this._grantedAccess = this._grantedAccess.filter(access => access.usr !== user.dbUser);
    }

    public hasAccess(user: IUser, perm: keyof typeof $Perms) {
        return this._grantedAccess.some(access => access.usr === user.dbUser && access.perms.includes(perm));
    }

    public writeDb(overwrite:boolean = false) {
        if (!this.perms.includes(<any>$Perms.Admin) && overwrite === false) 
            throw new Error(`Invalid permissions for user on db '${this._name}'`);
        const tables = this._tables.map(table => {
            return {
                name: table.name
            };
        })
        const granted = this._grantedAccess.map(access => {
            return {
                user: access.usr,
                perms: access.perms
            };
        })
        const db = {
            owner: this._owner.dbUser,
            name: this._name,
            tables,
            granted
        };

        return fs.writeFileSync(paths.getDbFilePath(this._cluster.root, this._name), JSON.stringify(db), 'utf-8');
    }

    public masterWrite() {
        for (const t of this._tables) {
            t.write(true)
        }
        this.writeDb(true)
    }

    public loadDb(overwrite:boolean = false) {
        if (!this.perms.includes(<any>$Perms.Admin) && overwrite === false) 
            throw new Error(`Invalid permissions for user on db '${this._name}'`);
        const file = fs.readFileSync(paths.getDbFilePath(this._cluster.root, this._name), 'utf-8');
        const db = JSON.parse(file);

        this._name = db.name;
        this._owner = db.owner;
        this._grantedAccess = db.granted

        for (const table of db.tables) {
            const schema = new Schema()
                .fromJson(
                    JSON.parse(
                        fs.readFileSync(
                            paths.getTableFilePath(
                                this._cluster.root,
                                this._name,
                                table.name,
                                'schema.json'
                            )
                        , 'utf-8')
                    )
                );
            const tab = new LimitedTable(this.perms, this._cluster, this._name, table.name, schema)
            tab.loadRecords(overwrite)
            this._tables.push(tab)
        }
    }
}
