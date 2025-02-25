import { Cluster } from './Cluster';
import { ISchemaItem } from './Schema';
import { $Types } from './Types';

import * as ut from 'fwutils'

export class Collection {
    private _records: any[] = [];
    private _structure: any = {};
    private _generators: string[] = []
    private _defaults: string[] = []

    set records(records: any[]) {
        this._records = records;
    }

    get records() {
        return [...this._records];
    }
    get structure() {
        return {...this._structure};
    }

    constructor(structure: any, protected cluster: Cluster|any = {_generators: new Map()}) {
        this._structure = structure;

        // Bypass missing field checks for generators and defaults
        for (const [field, val] of Object.entries(this._structure)) {
            const v:ISchemaItem = <any>val
            if (v.gen !== false) this._generators.push(field)
            if (v.default) this._defaults.push(field)
        }
    }

    public reset() {
        this._records = [];
    }

    public insert(record: any): any {
        // Validate record against structure
        for (const [field, val] of Object.entries(this._structure)) {
            const v: ISchemaItem = <any>val
            // console.log(field, v, this._generators, this._defaults)
            if (
                field === 'created' ||
                field === 'updated'
            ) continue;
            if (!(field in record)) {
                if (this._defaults.includes(field))
                    record[field] = v.default;
                else if (this._generators.includes(field))
                    //@ts-expect-error
                    if (this.cluster._generators.has(v.gen.base) && this.cluster._generators.has(v.gen.gen)) {
                        //@ts-expect-error
                        const base = this.cluster._generators.get(v.gen.base)
                        //@ts-expect-error
                        const gen = this.cluster._generators.get(v.gen.gen)
                        record[field] = gen(base(this, ut))
                    }
                    else throw new Error(`missing generator functions`)
                else    
                    throw new Error(`Missing required field '${field}'`);
            }
            //@ts-expect-error
            if (typeof record[field] !== this.getTypeFromEnum(<any>(val.type))) {
                throw new Error(`Invalid type for field '${field}'`);
            }
        }

        // Add timestamps
        const newRecord = {
            ...record,
            created: Date.now(),
            updated: Date.now()
        };

        // console.log(newRecord)

        this._records.push(newRecord);
        return newRecord;
    }

    public select(query: { [field: string]: any } = {}): any[] {
        return this._records.filter(record => {
            return Object.entries(query).every(([field, value]) => {
                if (value instanceof RegExp) {
                    return value.test(record[field]);
                }
                return record[field] === value;
            });
        });
    }

    public update(records: any[], updates: { [field: string]: any }) {
        for (const record of records) {
            const index = this._records.indexOf(record);
            if (index === -1) {
                throw new Error('Record not found');
            }

            // Create updated record by merging existing record with updates
            const updatedRecord = {
                ...this._records[index],
                ...updates,
                updated: Date.now() // Automatically update the 'updated' timestamp
            };

            // Validate updated record against structure
            for (const [field, value] of Object.entries(updatedRecord)) {
                if (field === 'created' || field === 'updated') continue;
                if (field in this._structure && 
                    typeof value !== this.getTypeFromEnum(this._structure[field].type)) {
                    throw new Error(`Invalid type for field '${field}'`);
                }
            }

            // Apply updates
            this._records[index] = updatedRecord;
            // return updatedRecord;
        }
    }

    public delete(records: any[]): boolean {
        for (const record of records) {
            const index = this._records.indexOf(record);
            if (index === -1) {
                return false;
            }
        
            this._records.splice(index, 1);
        }
        return true;
    }

    private getTypeFromEnum(typeEnum: number): string {
        switch (typeEnum) {
            case $Types.String: return 'string';
            case $Types.Number: return 'number';
            case $Types.Boolean: return 'boolean';
            case $Types.Date: return 'number'; // Date is an object in JavaScript
            case $Types.Object: return 'object';
            case $Types.Array: return 'object'; // Array is an object in JavaScript
            case $Types.Null: return 'object';
            case $Types.Undefined: return 'undefined';
            default: return 'any';
        }
    }
}
