import * as fs from 'fs';
import * as path from 'path';
import * as paths from './StorageLocations';
import {Schema} from './Schema';
import {Collection} from './Collection';
import { $Types } from './Types';

export {IUser} from './Types' 

export class User {
    private _cluster: any;
    private _collection: Collection;
    private _schema = new Schema()
        .addField('dbUser', $Types.String)
        .addField('dbPass', $Types.String)
        .addField('dbRole', $Types.String)
        .fields

    constructor(cluster: any) {
        this._cluster = cluster;
        this._collection = new Collection(this._schema);
    }

    public create(name: string, password: string, role: 'admin'|'user') {
        this._collection.insert({
            dbUser: name,
            dbPass: password,
            dbRole: role
        });
    }
    public remove(name: string) {
        this._collection.delete([{dbUser: name}]);
    }
    public update(name: string, updates: { [field: string]: any }) {
        this._collection.update([{dbUser: name}], updates);
    }
    public select(query: { [field: string]: any } = {}) {
        return this._collection.select(query);
    }

    public get (name: string) {
        return this.select({dbUser: name})[0];
    }

    public writeRecords() {
        return fs.writeFileSync(paths.getUsersFilePath(this._cluster.root), JSON.stringify(this._collection.records), 'utf-8');
    }
    public write() {
        return this.writeRecords();
    }
    public loadRecords() {
        this._collection.records = JSON.parse(fs.readFileSync(paths.getUsersFilePath(this._cluster.root), 'utf-8'));
        console.log(`loaded Users`)

        return this._collection.records
    }
}