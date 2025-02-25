export const $Types = {
    Null: 0,
    Undefined: 1,
    Boolean: 2,
    Number: 3,
    BigInt: 4,
    String: 5,
    Symbol: 6,
    Object: 7,
    Array: 8,
    Date: 9,
} as const;

export const $Perms = {
    Admin: 0,
    CreateTable: 1,
    Select: 2,
    Insert: 3,
    Update: 4,
    Delete: 5,
} as const;

export interface IUser {
    dbUser: string;
    dbPass: string;
    dbRole: string;
}

export interface IDBFile {
    owner: string,
    name: string,
    tables: {
        name: string
    }[]
    
    granted: {
        user: string,
        perms: number[]
    }[]
}

export interface ISchemaItem {
    type: number,
    gen: false | {
        base: string,
        gen:string
    }
    default?: any
}
