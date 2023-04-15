declare namespace UtilityTypes {
    /**
    Methods to exclude.
    */
    type ArrayLengthMutationKeys = 'splice' | 'push' | 'pop' | 'shift' | 'unshift';

    /**
    Create a type that represents an array of the given type and length. The array's length and the `Array` prototype methods that manipulate its length are excluded in the resulting type.
    Please participate in [this issue](https://github.com/microsoft/TypeScript/issues/26223) if you want to have a similiar type built into TypeScript.
    Use-cases:
    - Declaring fixed-length tuples or arrays with a large number of items.
    - Creating a range union (for example, `0 | 1 | 2 | 3 | 4` from the keys of such a type) without having to resort to recursive types.
    - Creating an array of coordinates with a static length, for example, length of 3 for a 3D vector.
    @example
    ```
    import {FixedLengthArray} from 'type-fest';
    type FencingTeam = FixedLengthArray<string, 3>;
    const guestFencingTeam: FencingTeam = ['Josh', 'Michael', 'Robert'];
    const homeFencingTeam: FencingTeam = ['George', 'John'];
    //=> error TS2322: Type string[] is not assignable to type 'FencingTeam'
    guestFencingTeam.push('Sam');
    //=> error TS2339: Property 'push' does not exist on type 'FencingTeam'
    ```
    @category Utilities
    */
    export type FixedLengthArray<Element, Length extends number, ArrayPrototype = [Element, ...Element[]]> = Pick<
        ArrayPrototype,
        Exclude<keyof ArrayPrototype, ArrayLengthMutationKeys>
    > & {
        [index: number]: Element;
        [Symbol.iterator]: () => IterableIterator<Element>;
        readonly length: Length;
    };


    /** basic */

    /**
    Matches a [`class`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
    @category Basic
    */
    export type Class<T, Arguments extends unknown[] = any[]> = Constructor<T, Arguments> & { prototype: T };

    /**
    Matches a [`class` constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
    @category Basic
    */
    export type Constructor<T, Arguments extends unknown[] = any[]> = new (...arguments_: Arguments) => T;

    /**
    Matches a JSON object.
    This type can be useful to enforce some input to be JSON-compatible or as a super-type to be extended from. Don't use this as a direct return type as the user would have to double-cast it: `jsonObject as unknown as CustomResponse`. Instead, you could extend your CustomResponse type from it to ensure your type only uses JSON-compatible types: `interface CustomResponse extends JsonObject { … }`.
    @category Basic
    */
    export type JsonObject = { [Key in string]?: JsonValue };

    /**
    Matches a JSON array.
    @category Basic
    */
    export type JsonArray = JsonValue[];

    /**
    Matches any valid JSON primitive value.
    @category Basic
    */
    export type JsonPrimitive = string | number | boolean | null;

    /**
    Matches any valid JSON value.
    @see `Jsonify` if you need to transform a type to one that is assignable to `JsonValue`.
    @category Basic
    */
    export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

    // Note: The return value has to be `any` and not `unknown` so it can match `void`.
    type NotJsonable = ((...args: any[]) => any) | undefined;

    /**
    Transform a type to one that is assignable to the `JsonValue` type.
    @remarks
    An interface cannot be structurally compared to `JsonValue` because an interface can be re-opened to add properties that may not be satisfy `JsonValue`.
    @example
    ```
    interface Geometry {
        type: 'Point' | 'Polygon';
        coordinates: [number, number];
    }
    const point: Geometry = {
        type: 'Point',
        coordinates: [1, 1]
    };
    const problemFn = (data: JsonValue) => {
        // Does something with data
    };
    problemFn(point); // Error: type Geometry is not assignable to parameter of type JsonValue because it is an interface
    const fixedFn = <T>(data: Jsonify<T>) => {
        // Does something with data
    };
    fixedFn(point); // Good: point is assignable. Jsonify<T> transforms Geometry into value assignable to JsonValue
    fixedFn(new Date()); // Error: As expected, Date is not assignable. Jsonify<T> cannot transforms Date into value assignable to JsonValue
    ```
    @link https://github.com/Microsoft/TypeScript/issues/1897#issuecomment-710744173
    @category Utilities
    */
    export type Jsonify<T> =
        // Check if there are any non-JSONable types represented in the union.
        // Note: The use of tuples in this first condition side-steps distributive conditional types
        // (see https://github.com/microsoft/TypeScript/issues/29368#issuecomment-453529532)
        [Extract<T, NotJsonable>] extends [never]
        ? T extends JsonPrimitive
        ? T // Primitive is acceptable
        : T extends Array<infer U>
        ? Array<Jsonify<U>> // It's an array: recursive call for its children
        : T extends object
        ? { [P in keyof T]: Jsonify<T[P]> } // It's an object: recursive call for its children
        : never // Otherwise any other non-object is removed
        : never; // Otherwise non-JSONable type union was found not empty


    /**
    Matches any [primitive value](https://developer.mozilla.org/en-US/docs/Glossary/Primitive).
    @category Basic
    */
    export type Primitive =
        | null
        | undefined
        | string
        | number
        | boolean
        | symbol
        | bigint;

    /**
    Convert `object`s, `Map`s, `Set`s, and `Array`s and all of their keys/elements into immutable structures recursively.
    This is useful when a deeply nested structure needs to be exposed as completely immutable, for example, an imported JSON module or when receiving an API response that is passed around.
    Please upvote [this issue](https://github.com/microsoft/TypeScript/issues/13923) if you want to have this type as a built-in in TypeScript.
    @example
    ```
    // data.json
    {
    "foo": ["bar"]
    }
    // main.ts
    import {ReadonlyDeep} from 'type-fest';
    import dataJson = require('./data.json');
    const data: ReadonlyDeep<typeof dataJson> = dataJson;
    export default data;
    // test.ts
    import data from './main';
    data.foo.push('bar');
    //=> error TS2339: Property 'push' does not exist on type 'readonly string[]'
    ```
    @category Utilities
    */
    export type ReadonlyDeep<T> = T extends Primitive | ((...arguments: any[]) => unknown)
        ? T
        : T extends ReadonlyMap<infer KeyType, infer ValueType>
        ? ReadonlyMapDeep<KeyType, ValueType>
        : T extends ReadonlySet<infer ItemType>
        ? ReadonlySetDeep<ItemType>
        : T extends object
        ? ReadonlyObjectDeep<T>
        : unknown;

    /**
    Same as `ReadonlyDeep`, but accepts only `ReadonlyMap`s as inputs. Internal helper for `ReadonlyDeep`.
    */
    interface ReadonlyMapDeep<KeyType, ValueType>
        extends ReadonlyMap<ReadonlyDeep<KeyType>, ReadonlyDeep<ValueType>> { }

    /**
    Same as `ReadonlyDeep`, but accepts only `ReadonlySet`s as inputs. Internal helper for `ReadonlyDeep`.
    */
    interface ReadonlySetDeep<ItemType>
        extends ReadonlySet<ReadonlyDeep<ItemType>> { }

    /**
    Same as `ReadonlyDeep`, but accepts only `object`s as inputs. Internal helper for `ReadonlyDeep`.
    */
    type ReadonlyObjectDeep<ObjectType extends object> = {
        readonly [KeyType in keyof ObjectType]: ReadonlyDeep<ObjectType[KeyType]>
    };


    /**
    Create a type from another type with all keys and nested keys set to optional.
    Use-cases:
    - Merging a default settings/config object with another object, the second object would be a deep partial of the default object.
    - Mocking and testing complex entities, where populating an entire object with its keys would be redundant in terms of the mock or test.
    @example
    ```
    import {PartialDeep} from 'type-fest';
    const settings: Settings = {
        textEditor: {
            fontSize: 14;
            fontColor: '#000000';
            fontWeight: 400;
        }
        autocomplete: false;
        autosave: true;
    };
    const applySavedSettings = (savedSettings: PartialDeep<Settings>) => {
        return {...settings, ...savedSettings};
    }
    settings = applySavedSettings({textEditor: {fontWeight: 500}});
    ```
    @category Utilities
    */
    export type PartialDeep<T> = T extends Primitive
        ? Partial<T>
        : T extends Map<infer KeyType, infer ValueType>
        ? PartialMapDeep<KeyType, ValueType>
        : T extends Set<infer ItemType>
        ? PartialSetDeep<ItemType>
        : T extends ReadonlyMap<infer KeyType, infer ValueType>
        ? PartialReadonlyMapDeep<KeyType, ValueType>
        : T extends ReadonlySet<infer ItemType>
        ? PartialReadonlySetDeep<ItemType>
        : T extends ((...arguments: any[]) => unknown)
        ? T | undefined
        : T extends object
        ? PartialObjectDeep<T>
        : unknown;

    /**
    Same as `PartialDeep`, but accepts only `Map`s and  as inputs. Internal helper for `PartialDeep`.
    */
    interface PartialMapDeep<KeyType, ValueType> extends Map<PartialDeep<KeyType>, PartialDeep<ValueType>> { }

    /**
    Same as `PartialDeep`, but accepts only `Set`s as inputs. Internal helper for `PartialDeep`.
    */
    interface PartialSetDeep<T> extends Set<PartialDeep<T>> { }

    /**
    Same as `PartialDeep`, but accepts only `ReadonlyMap`s as inputs. Internal helper for `PartialDeep`.
    */
    interface PartialReadonlyMapDeep<KeyType, ValueType> extends ReadonlyMap<PartialDeep<KeyType>, PartialDeep<ValueType>> { }

    /**
    Same as `PartialDeep`, but accepts only `ReadonlySet`s as inputs. Internal helper for `PartialDeep`.
    */
    interface PartialReadonlySetDeep<T> extends ReadonlySet<PartialDeep<T>> { }

    /**
    Same as `PartialDeep`, but accepts only `object`s as inputs. Internal helper for `PartialDeep`.
    */
    type PartialObjectDeep<ObjectType extends object> = {
        [KeyType in keyof ObjectType]?: PartialDeep<ObjectType[KeyType]>
    };

    /**
    Create a type that makes the given keys required. The remaining keys are kept as is. The sister of the `SetOptional` type.
    Use-case: You want to define a single model where the only thing that changes is whether or not some of the keys are required.
    @example
    ```
    import {SetRequired} from 'type-fest';
    type Foo = {
        a?: number;
        b: string;
        c?: boolean;
    }
    type SomeRequired = SetRequired<Foo, 'b' | 'c'>;
    // type SomeRequired = {
    // 	a?: number;
    // 	b: string; // Was already required and still is.
    // 	c: boolean; // Is now required.
    // }
    ```
    @category Utilities
    */
    export type SetRequired<BaseType, Keys extends keyof BaseType> =
        Simplify<
            // Pick just the keys that are optional from the base type.
            Except<BaseType, Keys> &
            // Pick the keys that should be required from the base type and make them required.
            Required<Pick<BaseType, Keys>>
        >;


    /**
    Flatten the type output to improve type hints shown in editors.
    @example
    ```
    import {Simplify} from 'type-fest';
    type PositionProps = {
        top: number;
        left: number;
    };
    type SizeProps = {
        width: number;
        height: number;
    };
    // In your editor, hovering over `Props` will show a flattened object with all the properties.
    type Props = Simplify<PositionProps & SizeProps>;
    ```
    @category Utilities
    */
    export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] };


    /**
    Create a type from an object type without certain keys.
    This type is a stricter version of [`Omit`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-5.html#the-omit-helper-type). The `Omit` type does not restrict the omitted keys to be keys present on the given type, while `Except` does. The benefits of a stricter type are avoiding typos and allowing the compiler to pick up on rename refactors automatically.
    This type was proposed to the TypeScript team, which declined it, saying they prefer that libraries implement stricter versions of the built-in types ([microsoft/TypeScript#30825](https://github.com/microsoft/TypeScript/issues/30825#issuecomment-523668235)).
    @example
    ```
    import {Except} from 'type-fest';
    type Foo = {
        a: number;
        b: string;
        c: boolean;
    };
    type FooWithoutA = Except<Foo, 'a' | 'c'>;
    //=> {b: string};
    ```
    @category Utilities
    */
    export type Except<ObjectType, KeysType extends keyof ObjectType> = Pick<ObjectType, Exclude<keyof ObjectType, KeysType>>;


    /**
    Create a type that requires at least one of the given keys. The remaining keys are kept as is.
    @example
    ```
    import {RequireAtLeastOne} from 'type-fest';
    type Responder = {
        text?: () => string;
        json?: () => string;
        secure?: boolean;
    };
    const responder: RequireAtLeastOne<Responder, 'text' | 'json'> = {
        json: () => '{"message": "ok"}',
        secure: true
    };
    ```
    @category Utilities
    */
    export type RequireAtLeastOne<
        ObjectType,
        KeysType extends keyof ObjectType = keyof ObjectType,
        > = {
            // For each `Key` in `KeysType` make a mapped type:
            [Key in KeysType]-?: Required<Pick<ObjectType, Key>> & // 1. Make `Key`'s type required
            // 2. Make all other keys in `KeysType` optional
            Partial<Pick<ObjectType, Exclude<KeysType, Key>>>;
        }[KeysType] &
        // 3. Add the remaining keys not in `KeysType`
        Except<ObjectType, KeysType>;

}