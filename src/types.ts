import { Action } from 'redux';

export type UpduxAction = Action & Partial<{
    payload: any,
    meta: any,
}>

export type Dictionary<T> = { [key: string]: T };

export type Mutation<S> = (payload: any, action: Action) => (state: S) => S ;
