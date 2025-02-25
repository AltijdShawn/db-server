import { $Types } from '../../db/Types'
import {Collection} from '../../db/Collection'
import {Schema} from '../../db/Schema'
import { Table } from '../../db/Table';
import { User } from "../../db/User";
import { Database } from '../../db/Database';

const dbUsers = new User({root: 'cluster1'})
dbUsers.create('admin', 'admin123', 'admin')

const dbUsr = dbUsers.get('admin')

const DB = new Database({root: 'cluster1'}, 'test1', dbUsr)
DB.createTable('users',
    new Schema()
        .addField('id', $Types.Number)
        .addField('username', $Types.String)
        .addField('password', $Types.String)
        .addField('email', $Types.String)
        .addField('role', $Types.String)
        .addField('created', $Types.Date)
        .addField('updated', $Types.Date)
        .fields
)

const usersTable = DB.getTable('users')
usersTable.insert({
    id: 1,
    username: "john_doe",
    password: "secret123",
    email: "john@example.com",
    role: "user",
    created: Date.now(),
    updated: Date.now(),
});
usersTable.write()

dbUsers.write()

DB.writeDb()