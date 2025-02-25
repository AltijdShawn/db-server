import { $Types } from '../../db/Types'
import {Collection} from '../../db/Collection'
import {Schema} from '../../db/Schema'

const $ = new Schema()
    .addField('id', $Types.Number)
    .addField('username', $Types.String)
    .addField('password', $Types.String)
    .addField('email', $Types.String)
    .addField('role', $Types.String)
    .addField('created', $Types.Date)
    .addField('updated', $Types.Date)
    .fields;

const usersCollection = new Collection($);

// Insert a new user
const newUser = usersCollection.insert({
    id: 1,
    username: "john_doe",
    password: "secret123",
    email: "john@example.com",
    role: "user",
    created: Date.now(),
    updated: Date.now(),
});

// Select users
const allUsers = usersCollection.select();
let adminUsers = usersCollection.select({ role: "admin" });
const johnUsers = usersCollection.select({ username: /^john/i });

//update john's role
const updated = usersCollection.update(johnUsers[0], { role: "admin" });
adminUsers = usersCollection.select({ role: "admin" });

// Delete a user
const deleted = usersCollection.delete(newUser);

console.log(allUsers);
console.log(adminUsers);
console.log(johnUsers);
console.log(deleted);