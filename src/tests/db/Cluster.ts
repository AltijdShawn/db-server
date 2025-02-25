import { $Perms, $Types } from '../../db/Types'
import {Collection} from '../../db/Collection'
import {Schema} from '../../db/Schema'
import { Table } from '../../db/Table';
import { User } from "../../db/User";
import { Database } from '../../db/Database';
import { Cluster } from '../../db/Cluster';


const Cluster1 = new Cluster('/home/amberemilyan/Public/testCluster-001')

Cluster1.createUser('Admin', 'Admin123', 'admin')
Cluster1.createUser('Test001', 'test123', 'user')

Cluster1.createDatabase('test1', Cluster1.getUser('Admin'))
const db_test1 = Cluster1.db(Cluster1.getUser('Admin'), 'test1')

db_test1.grantAccess(
    Cluster1.getUser('Test001'),
    [$Perms.Select as any]
)

db_test1.createTable('test1',
    new Schema()
        // .addField('id', $Types.Number)
        .addIdField()
        .addField('isTestRecord', $Types.Boolean, true)
        .addField('created', $Types.Date)
        .addField('updated', $Types.Date)
)

const tab_test1 = db_test1.getTable('test1')

tab_test1.insert({})
tab_test1.insert({})
tab_test1.insert({})
tab_test1.insert({})
tab_test1.insert({})
tab_test1.insert({})
tab_test1.insert({})
tab_test1.insert({})
tab_test1.insert({})
tab_test1.insert({})
tab_test1.insert({})
tab_test1.insert({})
tab_test1.insert({})
tab_test1.insert({})

Cluster1.masterWrite()

// const dbUsers = new User({root: 'cluster1'})
// dbUsers.create('admin', 'admin123', 'admin')

// const dbUsr = dbUsers.get('admin')

// const DB = new Database({root: 'cluster1'}, 'test1', dbUsr)
// DB.createTable('users',
//     new Schema()
//         .addField('id', $Types.Number)
//         .addField('username', $Types.String)
//         .addField('password', $Types.String)
//         .addField('email', $Types.String)
//         .addField('role', $Types.String)
//         .addField('created', $Types.Date)
//         .addField('updated', $Types.Date)
//         .fields
// )

// const usersTable = DB.getTable('users')
// usersTable.insert({
//     id: 1,
//     username: "john_doe",
//     password: "secret123",
//     email: "john@example.com",
//     role: "user",
//     created: Date.now(),
//     updated: Date.now(),
// });
// usersTable.write()

// dbUsers.write()

// DB.writeDb()