import * as fs from 'fs';
import * as path from 'path';
import * as paths from './StorageLocations';
import {Schema, type ISchemaItem} from './Schema';
import {Collection} from './Collection';
import { $Perms, $Types, type IUser } from './Types';
import { Cluster } from './Cluster';


export class Table {
    private _schema: {[field:string]: ISchemaItem};
    private _collection: Collection;
    private _name: string;

    private _cluster: any;
    private _database: string;

    get name() {
        return this._name;
    }

    get schema() {
        return {...this._schema};
    }

    constructor(cluster:any, database:string, name: string, schema: Schema|{[field:string]: number}) {
        this._cluster = cluster;
        this._database = database;
        this._name = name;

        if (!schema.fields) this._schema = <any>schema;
        else this._schema = schema.fields;
        this._collection = new Collection(this._schema, cluster);
    }

    public insert(record: any): any {
        return this._collection.insert(record);
    }

    public select(query: { [field: string]: any } = {}): any[] {
        return this._collection.select(query);
    }

    public update(record: any, updates: { [field: string]: any }) {
        return this._collection.update(record, updates);
    }

    public delete(record: any) {
        return this._collection.delete(record);
    }

    public writeRecords() {
        return fs.writeFileSync(paths.getTableFilePath(this._cluster.root, this._database, this._name, 'records.json'), JSON.stringify(this._collection.records), 'utf-8');
    }
    public writeSchemas() {
        return fs.writeFileSync(paths.getTableFilePath(this._cluster.root, this._database, this._name, 'schema.json'), JSON.stringify(this._schema), 'utf-8');
    }
    public write() {
        return [
            this.writeRecords(),
            this.writeSchemas()
        ];
    }
    public loadRecords() {
        this._collection.records = JSON.parse(fs.readFileSync(paths.getTableFilePath(this._cluster.root, this._database,  this._name, 'records.json'), 'utf-8'));
        console.log(`loaded table '${this._name}'`)
        return this._collection.records
    }
}

export class LimitedTable {
    private _schema: {[field:string]: number};
    private _collection: Collection;
    private _name: string;

    private _cluster: any;
    private _database: string;

    get name() {
        return this._name;
    }

    get schema() {
        return {...this._schema};
    }

    constructor(
        protected perms: (keyof typeof $Perms)[],
        cluster:Cluster, database:string, name: string, schema: Schema|{[field:string]: number}) {
        this._cluster = cluster;
        this._database = database;
        this._name = name;

        if (!schema.fields) this._schema = <any>schema;
        else this._schema = schema.fields;
        this._collection = new Collection(this._schema, cluster);
    }

    public insert(record: any): any {
        if (
            !this.perms.includes(<any>$Perms.Admin) &&
            !this.perms.includes(<any>$Perms.Insert)
        ) throw new Error(`Invalid permissions for user on on table '${this._name}' on db '${this._database}'`)
        return this._collection.insert(record);
    }

    public select(query: { [field: string]: any } = {}): any[] {
        if (
            !this.perms.includes(<any>$Perms.Admin) &&
            !this.perms.includes(<any>$Perms.Select)
        ) throw new Error(`Invalid permissions for user on on table '${this._name}' on db '${this._database}'`)
        return this._collection.select(query);
    }

    public update(record: any, updates: { [field: string]: any }) {
        if (
            !this.perms.includes(<any>$Perms.Admin) &&
            !this.perms.includes(<any>$Perms.Update)
        ) throw new Error(`Invalid permissions for user on on table '${this._name}' on db '${this._database}'`)
        return this._collection.update(record, updates);
    }

    public delete(record: any) {
        if (
            !this.perms.includes(<any>$Perms.Admin) &&
            !this.perms.includes(<any>$Perms.Delete)
        ) throw new Error(`Invalid permissions for user on on table '${this._name}' on db '${this._database}'`)
        return this._collection.delete(record);
    }

    public writeRecords(overwrite:boolean = false) {
        if (
            !this.perms.includes(<any>$Perms.Admin) && overwrite === false
        ) throw new Error(`Invalid permissions for user on on table '${this._name}' on db '${this._database}'`)
        
        return fs.writeFileSync(paths.getTableFilePath(this._cluster.root, this._database, this._name, 'records.json'), JSON.stringify(this._collection.records), 'utf-8');
    }
    public writeSchemas(overwrite:boolean = false) {
        if (
            !this.perms.includes(<any>$Perms.Admin) && overwrite === false
        ) throw new Error(`Invalid permissions for user on on table '${this._name}' on db '${this._database}'`)
        
        return fs.writeFileSync(paths.getTableFilePath(this._cluster.root, this._database, this._name, 'schema.json'), JSON.stringify(this._schema), 'utf-8');
    }
    public write(overwrite:boolean = false) {
        return [
            this.writeRecords(overwrite),
            this.writeSchemas(overwrite)
        ];
    }
    public loadRecords(overwrite:boolean = false) {
        if (
            !this.perms.includes(<any>$Perms.Admin) && overwrite === false
        ) throw new Error(`Invalid permissions for user on on table '${this._name}' on db '${this._database}'`)
        
        return this._collection.records = JSON.parse(fs.readFileSync(paths.getTableFilePath(this._cluster.root, this._database,  this._name, 'records.json'), 'utf-8'));
    }
}