import { IndexableObject } from './types';
export declare const isNumber: (x: any) => boolean;
export declare const isFunction: (x: any) => boolean;
export declare const isObject: (x: any) => boolean;
export declare const toArray: (arrayLike: ArrayLike<any>) => any[];
export declare const getDuplicateValsAsStrings: (arr: string[]) => string[];
export declare function assign(target: IndexableObject, ...args: IndexableObject[]): object;
export declare const tweenProp: (start: number, end: number, position: number) => number;
