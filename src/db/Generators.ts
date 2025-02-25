import * as ut from 'fwutils'
import { Collection } from './Collection';

export class Generators {

    public static id_base(_t: Collection, _u: typeof ut) {
        return _t.records.length
    }
    public static id_gen(len: number) {
        return len
    }
    
}