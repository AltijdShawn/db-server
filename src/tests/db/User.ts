import { User } from "../../db/User";

const user = new User({root: 'cluster1'});
user.create('admin', 'admin123', 'admin');
user.create('user', 'user123', 'user');
user.write();