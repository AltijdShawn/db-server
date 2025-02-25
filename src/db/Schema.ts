import { $Types } from './Types';

export {ISchemaItem} from './Types' 

export class Schema {
    private _fields: any = {};

    get fields() {
        return { ...this._fields };
    }

    public addIdField(name:string = 'id', type:number = $Types.Number) {
        this._fields[name] = {
            type,
            gen: {
                base: 'builtin_id_base',
                gen: 'builtin_id_gen'
            }
        }
        return this
    }

    public addGenField(name: string, type: number, base:string, gen:string) {
        this._fields[name] = {
            type,
            gen: {
                base,
                gen
            }
        };
        return this
    }

    public addField(name: string, type: number, _default?: any) {
        if (!_default) this._fields[name] = {
            type,
            gen: false
        };
        else this._fields[name] = {
            type,
            gen: false,
            default: _default
        };
        return this;
    }

    public fromJson(json: {[field:string]: number}) {
        for (const field in json) {
            this._fields[field] = json[field]
        }
        return this;
    }

    // add a method that validates a record against the schema
    public validate(record: any): boolean {
        for (const [field, val] of Object.entries(this._fields)) {
            if (field === 'created' || field === 'updated') continue;
            if (!(field in record)) {
                throw new Error(`Missing required field '${field}'`);
            }
            //@ts-expect-error
            if (typeof record[field] !== this.getTypeFromEnum(<any>(val.type))) {
                throw new Error(`Invalid type for field '${field}'`);
            }
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
