import { $Types } from '../../db/Types'
import {Collection} from '../../db/Collection'

const $_ = {
    Users: {
        name: "users",
        structure: {
            id: $Types.Number,
            username: $Types.String,
            password: $Types.String,
            email: $Types.String,
            role: $Types.String,
            created: $Types.Date,
            updated: $Types.Date,
        },
    },
};

const usersCollection = new Collection($_.Users.structure);

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