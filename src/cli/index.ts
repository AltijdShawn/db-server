import { input } from "@inquirer/prompts";
import { Logger } from "fwutils";
import { Cluster } from "../db/Cluster";
import { ISchemaItem, Schema } from "../db/Schema";
import { $Perms, $Types } from "../db/Types";
const logger = new Logger.Logger()

async function loop() {
    const launchArgs = process.argv
    const cluster = new Cluster(launchArgs[2] || '/usr/share/ddrm-db_server/default_cluster')

    try {cluster.masterLoad();} catch(e) {}

    logger.info(`Running cluster at: '${cluster.root}'`)
    let prompt_ = []
    while(true) {
        const prompt = prompt_.length === 0 
            ? await input({message: '#:'})
            : await input({message: '-:'})
        const parts = [...prompt_, ...(prompt.replaceAll(';', ' ;').split(' '))];

        if (
            parts[parts.length - 1] !== ';'     && 
            parts[parts.length - 1] !== '\\q'   && 
            parts[parts.length - 1] !== '\\q!'
        ) prompt_ = parts;

        else {
            prompt_ = []
            switch(parts[0].toLowerCase()) {
                case 'create':
                    try{handleCreate(parts,cluster)} catch(e) {logger.error(e)}
                    break;
                
                case 'grant':
                    try{handleGrant(parts,cluster)} catch(e) {logger.error(e)}
                    break;
                case 'revoke':
                    try{handleRevoke(parts,cluster)} catch(e) {logger.error(e)}
                    break;

                case 'insert':
                    try{handleInsert(parts,cluster)} catch(e) {logger.error(e)}
                    break;

                case 'update':
                    try{handleUpdate(parts,cluster)} catch(e) {logger.error(e)}
                    break;

                case 'select_fancy':
                case 'select':
                    try{handleSelect(parts, cluster)} catch(e) {logger.error(e)}
                    break;

                case 'delete':
                    try{handleDelete(parts, cluster)} catch(e) {logger.error(e)}
                    break;

                case 'commit':
                case 'writedb':
                    try{cluster.masterWrite()} catch(e) {logger.error(e)}
                    break;

                case '\\q!':
                    // try{cluster.masterWrite()} catch(e) {logger.error(e)}
                    process.exit(0)
                case '\\q':
                    try{cluster.masterWrite()} catch(e) {logger.error(e)}
                    process.exit(0)

                default:
                    logger.error('Unknown command')
                    break;
            }
        }
    }
}

function handleCreate(parts: string[], cluster: Cluster) {
    switch(parts[1].toLowerCase()) {
        case 'user':
            let password= parts[2]
            let role    = 'user'
            const passInd = parts.findIndex(item => item.toLowerCase() === 'password')
            const roleInd = parts.findIndex(item => item.toLowerCase() === 'role')
            if (passInd !== -1) password= parts[passInd +1]          
            if (roleInd !== -1) role    = parts[roleInd +1]
            cluster.createUser(parts[2], password, <any>role)
            break;
        case 'table':
            const name = parts[2]
            const dbInd = parts.findIndex(item => item.toLowerCase() === 'database')
            const schemInd = parts.findIndex(item => item.toLowerCase() === 'schema')
            
            cluster.getDatabase(parts[dbInd +1])
                .createTable(name, parseSchema(parts[schemInd +1]))
            break;
        case 'database':
            const ownerInd = parts.findIndex(item => item.toLowerCase() === 'owner')
            if (ownerInd === -1) 
                throw new Error('Expected an owner to be assigned to the database');
            cluster.createDatabase(parts[2], cluster.getUser(parts[ownerInd +1]));
            break;
    }
}

function handleGrant(parts: string[], cluster: Cluster) {
    const dbInd = parts.findIndex(item => item.toLowerCase() === 'database')
    const usrInd = parts.findIndex(item => item.toLowerCase() === 'user')
    const permsInd = parts.findIndex(item => item.toLowerCase() === 'perms')

    cluster.getDatabase(parts[dbInd +1])
        .grantAccess(cluster.getUser(parts[usrInd +1]), <any[]>permsToNum(parts[permsInd +1]));
}

function handleRevoke(parts: string[], cluster: Cluster) {
    const dbInd = parts.findIndex(item => item.toLowerCase() === 'database')
    const usrInd = parts.findIndex(item => item.toLowerCase() === 'user')
    const permsInd = parts.findIndex(item => item.toLowerCase() === 'perms')

    cluster.getDatabase(parts[dbInd +1])
        .revokeAccess(
            cluster.getUser(parts[usrInd +1]),
            permsInd === -1
                ? undefined
                : <any[]>permsToNum(parts[permsInd +1])
        );
}

function handleInsert(parts: string[], cluster: Cluster) {
    const dbInd = parts.findIndex(item => item.toLowerCase() === 'database')
    const tableInd = parts.findIndex(item => item.toLowerCase() === 'table')
    const valuesInd = parts.findIndex(item => item.toLowerCase() === 'values')
    const valuesAllInd = parts.findIndex(item => item.toLowerCase() === 'values_all')

    const table = cluster.getDatabase(parts[dbInd +1])
        .getTable(parts[tableInd +1]);
    
    table.insert(parseRecords(table.schema, parts[valuesInd +1]))
}

function handleSelect(parts: string[], cluster: Cluster) {
    const dbInd = parts.findIndex(item => item.toLowerCase() === 'database')
    const tableInd = parts.findIndex(item => item.toLowerCase() === 'table')
    const whereInd = parts.findIndex(item => item.toLowerCase() === 'where')

    const table = cluster.getDatabase(parts[dbInd +1])
        .getTable(parts[tableInd +1]);
    const schema = table.schema

    let query = parseRecords(schema, parts[whereInd +1]);

    const retVal = table.select(query)

    if (parts[0] === 'select') return console.log(retVal);
    else if (parts[0] === 'select_fancy') {
        console.table(retVal)
    }
}

function handleUpdate(parts: string[], cluster: Cluster) {
    const dbInd = parts.findIndex(item => item.toLowerCase() === 'database')
    const tableInd = parts.findIndex(item => item.toLowerCase() === 'table')
    const whereInd = parts.findIndex(item => item.toLowerCase() === 'where')
    const changeInd = parts.findIndex(item => item.toLowerCase() === 'change')
    const table = cluster.getDatabase(parts[dbInd +1])
        .getTable(parts[tableInd +1]);
    const schema = table.schema
    const squery = parseRecords(schema, parts[whereInd +1]);
    const uquery = parseRecords(schema, parts[changeInd +1]);
    const recs = table.select(squery)

    table.update(recs, uquery)
}

function handleDelete(parts: string[], cluster: Cluster) {
    const dbInd = parts.findIndex(item => item.toLowerCase() === 'database')
    const tableInd = parts.findIndex(item => item.toLowerCase() === 'table')
    const whereInd = parts.findIndex(item => item.toLowerCase() === 'where')
    const table = cluster.getDatabase(parts[dbInd +1])
        .getTable(parts[tableInd +1]);
    const schema = table.schema
    const squery = parseRecords(schema, parts[whereInd +1]);
    const recs = table.select(squery)

    table.delete(recs)
}


function parseRecords(schema: {[field:string]:ISchemaItem}, str: string) {
    const spl = str.split('|')
    let record = {}
    for (const i of spl) {
        if (i.startsWith('{')) {
            let spl2: any[] = i.replaceAll('{', '').replaceAll('}', '').split(',')
            // Schem.addField(spl2[0],parseType(spl2[1]),<any>spl2[2])
            const schemField = schema[spl2[0]];
            if (schemField.type === $Types.Boolean && spl2[1] === 'true') spl2[1] = true;
            if (schemField.type === $Types.Boolean && spl2[1] === 'false') spl2[1] = false;
            if (schemField.type === $Types.Number) spl2[1] = Number(spl2[1]);
            if (schemField.type === $Types.Date) spl2[1] = Number(spl2[1]);

            record[spl2[0]] = spl2[1]
        }
    }
    return record
}

function permsToNum(str:string) {
    const perms_ = str.split(',')
    const perms = perms_.length === 1
        ? perms_[0].split('|')
        : perms_
    let nums: number[] = []
    for (const p of perms) {
        nums.push(parsePerms(p))
    }
    return nums
}

function parseSchema(str:string) {
    const spl = str.split('|')
    const Schem = new Schema()
    for (const i of spl) {
        // console.log(i)
        if (i === 'idfield') Schem.addIdField();
        if (i.startsWith('{')) {
            const spl2 = i.replaceAll('{', '').replaceAll('}', '').split(',')
            Schem.addField(spl2[0],parseType(spl2[1]),<any>spl2[2])
        }
    }
    return Schem
}

function parsePerms(p:string) {
    if(p.toLowerCase()==='admin') return $Perms.Admin
    if(p.toLowerCase()==='createtable') return $Perms.CreateTable
    if(p.toLowerCase()==='select') return $Perms.Select
    if(p.toLowerCase()==='insert') return $Perms.Insert
    if(p.toLowerCase()==='update') return $Perms.Update
    if(p.toLowerCase()==='delete') return $Perms.Delete

}

function parseType(t:string) {
    if(t.toLowerCase()==='null') return $Types.Null
    if(t.toLowerCase()==='undefined') return $Types.Undefined
    if(t.toLowerCase()==='boolean') return $Types.Boolean
    if(t.toLowerCase()==='number') return $Types.Number
    if(t.toLowerCase()==='bigint') return $Types.BigInt
    if(t.toLowerCase()==='string') return $Types.String
    if(t.toLowerCase()==='symbol') return $Types.Symbol
    if(t.toLowerCase()==='object') return $Types.Object
    if(t.toLowerCase()==='array') return $Types.Array
    if(t.toLowerCase()==='date') return $Types.Date
}

loop()